from __future__ import annotations

import logging
from datetime import UTC, datetime

from sqlalchemy import String, cast, desc, func, or_, select
from sqlalchemy.orm import Session

from app.models.enums import UserRole
from app.models.payment import Payment
from app.models.subscription import Subscription
from app.models.support_action_log import SupportActionLog
from app.models.support_dialog import SupportDialog
from app.models.support_message import SupportMessage
from app.models.tariff import Tariff
from app.models.user import User
from app.services.notification_service import queue_direct_notification

logger = logging.getLogger(__name__)

SUPPORT_DIALOG_STATUSES = {"open", "waiting_user", "waiting_support", "closed"}
MAX_MESSAGE_CHARS = 4000
MAX_SUBJECT_CHARS = 160
MAX_PREVIEW_CHARS = 180


def _display_name(user: User | None) -> str:
    if user is None:
        return "-"
    if user.first_name and user.first_name.strip():
        return user.first_name.strip()
    if user.username and user.username.strip():
        return f"@{user.username.strip()}"
    return str(user.telegram_id)


def _clip(value: str, max_len: int) -> str:
    cleaned = " ".join(value.strip().split())
    if len(cleaned) <= max_len:
        return cleaned
    return f"{cleaned[: max_len - 1].rstrip()}..."


def _clean_message(text: str) -> str:
    cleaned = text.strip()
    if not cleaned:
        raise ValueError("Сообщение не может быть пустым")
    if len(cleaned) > MAX_MESSAGE_CHARS:
        raise ValueError("Сообщение слишком длинное")
    return cleaned


def _clean_subject(value: str | None) -> str | None:
    if not value:
        return None
    cleaned = " ".join(value.strip().split())
    if not cleaned:
        return None
    return cleaned[:MAX_SUBJECT_CHARS]


def _serialize_message(item: SupportMessage, sender: User | None) -> dict:
    return {
        "id": str(item.id),
        "dialog_id": str(item.dialog_id),
        "sender_user_id": str(item.sender_user_id),
        "sender_role": item.sender_role,
        "sender_name": _display_name(sender),
        "body": item.body,
        "created_at": item.created_at,
    }


def _resolve_last_actor_name(dialog: SupportDialog, owner: User, actor_map: dict[str, User]) -> str | None:
    role = (dialog.last_message_by_role or "").strip().lower()
    if role == UserRole.user.value:
        return _display_name(owner)

    if dialog.last_message_by_user_id:
        actor = actor_map.get(str(dialog.last_message_by_user_id))
        if actor:
            return _display_name(actor)

    if role == UserRole.admin.value:
        return "Admin"
    if role == UserRole.support.value:
        return "Support"
    return None


def _serialize_dialog(dialog: SupportDialog, owner: User, actor_map: dict[str, User]) -> dict:
    return {
        "id": str(dialog.id),
        "user_id": str(dialog.user_id),
        "user_telegram_id": owner.telegram_id,
        "user_username": owner.username,
        "user_first_name": owner.first_name,
        "status": dialog.status,
        "subject": dialog.subject,
        "last_message_preview": dialog.last_message_preview,
        "last_message_at": dialog.last_message_at,
        "last_message_by_role": dialog.last_message_by_role,
        "last_message_by_name": _resolve_last_actor_name(dialog, owner, actor_map),
        "unread_for_staff": dialog.unread_for_staff,
        "unread_for_user": dialog.unread_for_user,
        "created_at": dialog.created_at,
        "updated_at": dialog.updated_at,
    }


def log_support_action(
    db: Session,
    action_type: str,
    actor: User | None = None,
    dialog_id: str | None = None,
    target_user_id: str | None = None,
    meta: dict | None = None,
    commit: bool = False,
) -> SupportActionLog:
    item = SupportActionLog(
        actor_user_id=actor.id if actor else None,
        actor_role=actor.role.value if actor else None,
        action_type=action_type,
        dialog_id=dialog_id,
        target_user_id=target_user_id,
        meta=meta,
    )
    db.add(item)
    if commit:
        db.commit()
        db.refresh(item)
    return item


def _dialog_messages(db: Session, dialog_id: str) -> list[dict]:
    rows = db.execute(
        select(SupportMessage, User)
        .join(User, User.id == SupportMessage.sender_user_id, isouter=True)
        .where(SupportMessage.dialog_id == dialog_id)
        .order_by(SupportMessage.created_at.asc())
    ).all()
    return [_serialize_message(item, sender) for item, sender in rows]


def _dialog_context(db: Session, user_id: object) -> dict:
    sub_row = db.execute(
        select(Subscription, Tariff)
        .join(Tariff, Tariff.id == Subscription.tariff_id)
        .where(Subscription.user_id == user_id)
        .order_by(desc(Subscription.ends_at))
        .limit(1)
    ).first()

    if sub_row:
        subscription, tariff = sub_row
        subscription_payload = {
            "tariff": tariff.code,
            "status": subscription.status.value,
            "ends_at": subscription.ends_at,
        }
    else:
        subscription_payload = {
            "tariff": "free",
            "status": "inactive",
            "ends_at": None,
        }

    payment_rows = db.scalars(
        select(Payment)
        .where(Payment.user_id == user_id)
        .order_by(desc(Payment.created_at))
        .limit(5)
    ).all()

    payments_payload = [
        {
            "id": str(item.id),
            "status": item.status.value,
            "amount_rub": item.amount_rub,
            "access_level": item.access_level_snapshot,
            "duration_days": item.duration_days_snapshot,
            "method_name": item.method_name_snapshot,
            "review_comment": item.review_comment,
            "created_at": item.created_at,
        }
        for item in payment_rows
    ]

    return {
        "subscription": subscription_payload,
        "recent_payments": payments_payload,
    }


def get_user_dialog_detail(db: Session, user: User) -> dict:
    dialog = db.scalar(select(SupportDialog).where(SupportDialog.user_id == user.id))
    if dialog is None:
        return {
            "dialog": None,
            "messages": [],
            "context": None,
        }

    changed = False
    if dialog.unread_for_user > 0:
        dialog.unread_for_user = 0
        db.add(dialog)
        changed = True

    if changed:
        db.commit()
        db.refresh(dialog)

    return {
        "dialog": _serialize_dialog(dialog, user, {}),
        "messages": _dialog_messages(db, str(dialog.id)),
        "context": None,
    }


def send_user_dialog_message(db: Session, user: User, body: str, subject: str | None = None) -> dict:
    cleaned_body = _clean_message(body)
    cleaned_subject = _clean_subject(subject)

    dialog = db.scalar(select(SupportDialog).where(SupportDialog.user_id == user.id))
    if dialog is None:
        dialog = SupportDialog(user_id=user.id, status="open")
        db.add(dialog)
        db.flush()

    previous_status = dialog.status
    now = datetime.now(UTC)
    if cleaned_subject and not dialog.subject:
        dialog.subject = cleaned_subject

    message = SupportMessage(
        dialog_id=dialog.id,
        sender_user_id=user.id,
        sender_role=UserRole.user.value,
        body=cleaned_body,
    )
    db.add(message)

    dialog.status = "waiting_support"
    dialog.last_message_preview = _clip(cleaned_body, MAX_PREVIEW_CHARS)
    dialog.last_message_at = now
    dialog.last_message_by_user_id = user.id
    dialog.last_message_by_role = UserRole.user.value
    dialog.unread_for_staff = max(0, dialog.unread_for_staff) + 1
    dialog.unread_for_user = 0
    db.add(dialog)

    log_support_action(
        db,
        action_type="user_message_sent",
        actor=user,
        dialog_id=str(dialog.id),
        target_user_id=str(user.id),
        meta={"preview": _clip(cleaned_body, 120)},
    )
    if previous_status != dialog.status:
        log_support_action(
            db,
            action_type="dialog_status_changed",
            actor=user,
            dialog_id=str(dialog.id),
            target_user_id=str(user.id),
            meta={"from": previous_status, "to": dialog.status},
        )
    if previous_status == "closed":
        log_support_action(
            db,
            action_type="dialog_reopened",
            actor=user,
            dialog_id=str(dialog.id),
            target_user_id=str(user.id),
        )

    db.commit()
    return get_user_dialog_detail(db, user)


def list_staff_dialogs(
    db: Session,
    q: str | None = None,
    status: str | None = None,
    unread_only: bool = False,
    limit: int = 100,
) -> list[dict]:
    stmt = select(SupportDialog, User).join(User, User.id == SupportDialog.user_id)

    normalized_status = (status or "").strip().lower()
    if normalized_status in SUPPORT_DIALOG_STATUSES:
        stmt = stmt.where(SupportDialog.status == normalized_status)

    if unread_only:
        stmt = stmt.where(SupportDialog.unread_for_staff > 0)

    if q and q.strip():
        query = q.strip()
        query_like = f"%{query.lower()}%"
        stmt = stmt.where(
            or_(
                cast(User.telegram_id, String).like(f"%{query}%"),
                func.lower(func.coalesce(User.username, "")).like(query_like),
                func.lower(func.coalesce(User.first_name, "")).like(query_like),
                func.lower(func.coalesce(SupportDialog.subject, "")).like(query_like),
                func.lower(func.coalesce(SupportDialog.last_message_preview, "")).like(query_like),
            )
        )

    rows = db.execute(
        stmt.order_by(desc(func.coalesce(SupportDialog.last_message_at, SupportDialog.updated_at))).limit(max(1, min(limit, 300)))
    ).all()

    actor_ids = {dialog.last_message_by_user_id for dialog, _ in rows if dialog.last_message_by_user_id is not None}
    actors = db.scalars(select(User).where(User.id.in_(actor_ids))).all() if actor_ids else []
    actor_map = {str(item.id): item for item in actors}

    return [_serialize_dialog(dialog, owner, actor_map) for dialog, owner in rows]


def get_staff_dialog_detail(db: Session, dialog_id: str, actor: User, mark_open: bool = True) -> dict:
    dialog = db.get(SupportDialog, dialog_id)
    if not dialog:
        raise ValueError("Диалог не найден")
    owner = db.get(User, dialog.user_id)
    if not owner:
        raise ValueError("Пользователь диалога не найден")

    actor_map: dict[str, User] = {}
    if dialog.last_message_by_user_id:
        last_actor = db.get(User, dialog.last_message_by_user_id)
        if last_actor:
            actor_map[str(last_actor.id)] = last_actor

    if mark_open:
        if dialog.unread_for_staff > 0:
            dialog.unread_for_staff = 0
            db.add(dialog)

        log_support_action(
            db,
            action_type="dialog_opened",
            actor=actor,
            dialog_id=str(dialog.id),
            target_user_id=str(owner.id),
        )
        db.commit()
        db.refresh(dialog)

    return {
        "dialog": _serialize_dialog(dialog, owner, actor_map),
        "messages": _dialog_messages(db, str(dialog.id)),
        "context": _dialog_context(db, owner.id),
    }


def send_staff_dialog_message(db: Session, dialog_id: str, actor: User, body: str) -> dict:
    if actor.role not in {UserRole.admin, UserRole.support}:
        raise ValueError("Недостаточно прав")

    cleaned_body = _clean_message(body)
    dialog = db.get(SupportDialog, dialog_id)
    if not dialog:
        raise ValueError("Диалог не найден")
    owner = db.get(User, dialog.user_id)
    if not owner:
        raise ValueError("Пользователь диалога не найден")
    previous_status = dialog.status
    now = datetime.now(UTC)

    message = SupportMessage(
        dialog_id=dialog.id,
        sender_user_id=actor.id,
        sender_role=actor.role.value,
        body=cleaned_body,
    )
    db.add(message)

    dialog.status = "waiting_user"
    dialog.last_message_preview = _clip(cleaned_body, MAX_PREVIEW_CHARS)
    dialog.last_message_at = now
    dialog.last_message_by_user_id = actor.id
    dialog.last_message_by_role = actor.role.value
    dialog.unread_for_user = max(0, dialog.unread_for_user) + 1
    dialog.unread_for_staff = 0
    db.add(dialog)

    log_support_action(
        db,
        action_type="support_message_sent",
        actor=actor,
        dialog_id=str(dialog.id),
        target_user_id=str(owner.id),
        meta={"preview": _clip(cleaned_body, 120)},
    )
    if previous_status != dialog.status:
        log_support_action(
            db,
            action_type="dialog_status_changed",
            actor=actor,
            dialog_id=str(dialog.id),
            target_user_id=str(owner.id),
            meta={"from": previous_status, "to": dialog.status},
        )
    if previous_status == "closed":
        log_support_action(
            db,
            action_type="dialog_reopened",
            actor=actor,
            dialog_id=str(dialog.id),
            target_user_id=str(owner.id),
        )

    db.commit()

    try:
        staff_name = _display_name(actor)
        queue_direct_notification(
            db,
            title="Ответ поддержки PIT BET",
            message=(
                f"{staff_name}: {cleaned_body}\n\n"
                "Откройте PIT BET Mini App и раздел Поддержка, чтобы продолжить диалог."
            ),
            user_id=str(owner.id),
        )
    except Exception as exc:
        logger.warning("support_reply_notification_failed dialog_id=%s reason=%s", dialog.id, exc)

    return get_staff_dialog_detail(db, dialog_id=str(dialog.id), actor=actor, mark_open=False)


def update_dialog_status(db: Session, dialog_id: str, status: str, actor: User) -> dict:
    normalized_status = (status or "").strip().lower()
    if normalized_status not in SUPPORT_DIALOG_STATUSES:
        raise ValueError("Некорректный статус")

    dialog = db.get(SupportDialog, dialog_id)
    if not dialog:
        raise ValueError("Диалог не найден")
    owner = db.get(User, dialog.user_id)
    if not owner:
        raise ValueError("Пользователь диалога не найден")
    previous_status = dialog.status
    if previous_status == normalized_status:
        return get_staff_dialog_detail(db, dialog_id=str(dialog.id), actor=actor, mark_open=False)

    dialog.status = normalized_status
    if normalized_status == "closed":
        dialog.unread_for_staff = 0
    db.add(dialog)

    log_support_action(
        db,
        action_type="dialog_status_changed",
        actor=actor,
        dialog_id=str(dialog.id),
        target_user_id=str(owner.id),
        meta={"from": previous_status, "to": normalized_status},
    )
    if normalized_status == "closed":
        log_support_action(
            db,
            action_type="dialog_closed",
            actor=actor,
            dialog_id=str(dialog.id),
            target_user_id=str(owner.id),
        )
    if previous_status == "closed" and normalized_status != "closed":
        log_support_action(
            db,
            action_type="dialog_reopened",
            actor=actor,
            dialog_id=str(dialog.id),
            target_user_id=str(owner.id),
        )

    db.commit()
    return get_staff_dialog_detail(db, dialog_id=str(dialog.id), actor=actor, mark_open=False)


def list_support_action_logs(
    db: Session,
    dialog_id: str | None = None,
    target_user_id: str | None = None,
    action_type: str | None = None,
    limit: int = 200,
) -> list[dict]:
    stmt = select(SupportActionLog)

    if dialog_id:
        stmt = stmt.where(cast(SupportActionLog.dialog_id, String) == dialog_id)
    if target_user_id:
        stmt = stmt.where(cast(SupportActionLog.target_user_id, String) == target_user_id)
    if action_type and action_type.strip():
        stmt = stmt.where(SupportActionLog.action_type == action_type.strip())

    rows = db.scalars(stmt.order_by(desc(SupportActionLog.created_at)).limit(max(1, min(limit, 500)))).all()

    user_ids: set[object] = set()
    for item in rows:
        if item.actor_user_id:
            user_ids.add(item.actor_user_id)
        if item.target_user_id:
            user_ids.add(item.target_user_id)

    users = db.scalars(select(User).where(User.id.in_(user_ids))).all() if user_ids else []
    user_map = {str(item.id): item for item in users}

    payload: list[dict] = []
    for item in rows:
        actor_user = user_map.get(str(item.actor_user_id)) if item.actor_user_id else None
        target_user = user_map.get(str(item.target_user_id)) if item.target_user_id else None
        payload.append(
            {
                "id": str(item.id),
                "actor_user_id": str(item.actor_user_id) if item.actor_user_id else None,
                "actor_role": item.actor_role,
                "actor_name": _display_name(actor_user) if actor_user else None,
                "action_type": item.action_type,
                "dialog_id": str(item.dialog_id) if item.dialog_id else None,
                "target_user_id": str(item.target_user_id) if item.target_user_id else None,
                "target_name": _display_name(target_user) if target_user else None,
                "meta": item.meta,
                "created_at": item.created_at,
            }
        )
    return payload
