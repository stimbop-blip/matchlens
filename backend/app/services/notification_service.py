from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.prediction import Prediction
from app.models.subscription import Subscription
from app.models.tariff import Tariff
from app.models.user import User
from app.models.user_settings import UserSettings


def _allowed_levels(access_level: str) -> set[str]:
    if access_level == "vip":
        return {"vip"}
    if access_level == "premium":
        return {"premium", "vip"}
    return {"free", "premium", "vip"}


def _active_level_map(db: Session) -> dict[str, str]:
    level_map: dict[str, str] = {}
    active_subs = db.execute(
        select(Subscription, Tariff)
        .join(Tariff, Tariff.id == Subscription.tariff_id)
        .where(Subscription.status == "active")
    ).all()
    now = datetime.now(UTC)
    for sub, tariff in active_subs:
        if sub.ends_at and sub.ends_at < now:
            continue
        level_map[str(sub.user_id)] = tariff.code
    return level_map


def _user_settings_map(db: Session) -> dict[str, UserSettings]:
    rows = db.scalars(select(UserSettings)).all()
    return {str(item.user_id): item for item in rows}


def get_or_create_user_settings(db: Session, user: User) -> UserSettings:
    settings = db.scalar(select(UserSettings).where(UserSettings.user_id == user.id))
    if settings:
        return settings

    settings = UserSettings(
        user_id=user.id,
        notify_new_predictions=True,
        notifications_enabled=True,
        notify_free=True,
        notify_premium=True,
        notify_vip=True,
        notify_results=True,
        notify_subscription=True,
    )
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def get_notification_settings(db: Session, user: User) -> dict:
    settings = get_or_create_user_settings(db, user)
    return {
        "notifications_enabled": bool(settings.notifications_enabled),
        "notify_free": bool(settings.notify_free),
        "notify_premium": bool(settings.notify_premium),
        "notify_vip": bool(settings.notify_vip),
        "notify_results": bool(settings.notify_results),
    }


def update_notification_settings(db: Session, user: User, payload: dict) -> dict:
    settings = get_or_create_user_settings(db, user)
    for field in ["notifications_enabled", "notify_free", "notify_premium", "notify_vip", "notify_results"]:
        if field in payload and payload[field] is not None:
            setattr(settings, field, bool(payload[field]))
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return get_notification_settings(db, user)


def queue_broadcast(db: Session, title: str, message: str, access_level: str = "free") -> int:
    users = db.scalars(select(User)).all()
    level_map = _active_level_map(db)
    settings_map = _user_settings_map(db)

    allowed = _allowed_levels(access_level)
    created = 0
    for user in users:
        user_level = level_map.get(str(user.id), "free")
        if user_level not in allowed:
            continue
        settings = settings_map.get(str(user.id))
        if settings and not settings.notifications_enabled:
            continue
        db.add(Notification(user_id=user.id, type="manual", title=title, message=message, status="queued"))
        created += 1

    db.commit()
    return created


def queue_prediction_notification(db: Session, access_level: str, title: str, message: str) -> int:
    users = db.scalars(select(User)).all()
    level_map = _active_level_map(db)
    settings_map = _user_settings_map(db)
    allowed = _allowed_levels(access_level)

    created = 0
    for user in users:
        user_id = str(user.id)
        user_level = level_map.get(user_id, "free")
        if user_level not in allowed:
            continue

        settings = settings_map.get(user_id)
        if settings and not settings.notifications_enabled:
            continue
        if settings and not settings.notify_new_predictions:
            continue
        if access_level == "free" and settings and not settings.notify_free:
            continue
        if access_level == "premium" and settings and not settings.notify_premium:
            continue
        if access_level == "vip" and settings and not settings.notify_vip:
            continue

        db.add(Notification(user_id=user.id, type="prediction_created", title=title, message=message, status="queued"))
        created += 1

    db.commit()
    return created


def queue_prediction_result_notification(db: Session, prediction: Prediction) -> int:
    users = db.scalars(select(User)).all()
    level_map = _active_level_map(db)
    settings_map = _user_settings_map(db)
    allowed = _allowed_levels(prediction.access_level.value)

    if prediction.status.value == "won":
        status_text = "Выигрыш"
    elif prediction.status.value == "lost":
        status_text = "Проигрыш"
    elif prediction.status.value == "refund":
        status_text = "Возврат"
    else:
        return 0

    title = f"Результат прогноза: {status_text}"
    message = (
        f"{prediction.match_name}\n"
        f"Лига: {prediction.league or '-'}\n"
        f"Сигнал: {prediction.signal_type}\n"
        f"Коэффициент: {float(prediction.odds)}\n"
        f"Доступ: {prediction.access_level.value.upper()}"
    )

    created = 0
    for user in users:
        user_id = str(user.id)
        user_level = level_map.get(user_id, "free")
        if user_level not in allowed:
            continue
        settings = settings_map.get(user_id)
        if settings and not settings.notifications_enabled:
            continue
        if settings and not settings.notify_results:
            continue
        if prediction.access_level.value == "free" and settings and not settings.notify_free:
            continue
        if prediction.access_level.value == "premium" and settings and not settings.notify_premium:
            continue
        if prediction.access_level.value == "vip" and settings and not settings.notify_vip:
            continue

        db.add(Notification(user_id=user.id, type="prediction_result", title=title, message=message, status="queued"))
        created += 1

    db.commit()
    return created


def pull_queued_notifications(db: Session, limit: int = 20) -> list[tuple[Notification, User]]:
    rows = db.execute(
        select(Notification, User)
        .join(User, User.id == Notification.user_id)
        .where(Notification.status == "queued")
        .order_by(Notification.created_at.asc())
        .limit(limit)
    ).all()
    return list(rows)


def mark_notification_sent(db: Session, notification_id: str) -> bool:
    row = db.get(Notification, notification_id)
    if not row:
        return False
    row.status = "sent"
    row.sent_at = datetime.now(UTC)
    db.add(row)
    db.commit()
    return True


def mark_notification_failed(db: Session, notification_id: str) -> bool:
    row = db.get(Notification, notification_id)
    if not row:
        return False
    row.status = "failed"
    db.add(row)
    db.commit()
    return True


def queue_expiring_subscription_notifications(db: Session, hours_before: int = 24) -> int:
    now = datetime.now(UTC)
    horizon = now.replace(microsecond=0) + timedelta(hours=hours_before)

    rows = db.execute(
        select(Subscription, Tariff, User)
        .join(Tariff, Tariff.id == Subscription.tariff_id)
        .join(User, User.id == Subscription.user_id)
        .where(
            and_(
                Subscription.status == "active",
                Subscription.ends_at > now,
                Subscription.ends_at <= horizon,
            )
        )
    ).all()

    created = 0
    for subscription, tariff, user in rows:
        settings = get_or_create_user_settings(db, user)
        if not settings.notifications_enabled or not settings.notify_subscription:
            continue
        existing = db.scalar(
            select(Notification.id)
            .where(
                Notification.user_id == user.id,
                Notification.type == "subscription_expiring",
                Notification.created_at >= now.replace(hour=0, minute=0, second=0, microsecond=0),
            )
            .limit(1)
        )
        if existing:
            continue

        db.add(
            Notification(
                user_id=user.id,
                type="subscription_expiring",
                title="Подписка скоро закончится",
                message=(
                    f"Ваш тариф {tariff.name} действует до "
                    f"{subscription.ends_at.strftime('%d.%m.%Y %H:%M')}"
                ),
                status="queued",
            )
        )
        created += 1

    db.commit()
    return created
