from __future__ import annotations

import logging

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.chat_message import ChatMessage
from app.models.enums import UserRole
from app.models.user import User

logger = logging.getLogger(__name__)

MAX_CHAT_MESSAGE_CHARS = 500
CHAT_HISTORY_LIMIT = 200


class ChatBlockedError(Exception):
    """Пользователь заблокирован и не может писать в чат."""


class ChatNotFoundError(Exception):
    """Сообщение не найдено."""


def _display_name(user: User | None) -> str:
    if user is None:
        return "-"
    if user.first_name and user.first_name.strip():
        base = user.first_name.strip()
        if user.last_name and user.last_name.strip():
            base = f"{base} {user.last_name.strip()}"
        return base
    if user.username and user.username.strip():
        return f"@{user.username.strip()}"
    return str(user.telegram_id)


def _initials(user: User | None) -> str:
    name = _display_name(user)
    if name.startswith("@"):
        name = name[1:]
    tg = str(user.telegram_id) if user else ""
    name = name.replace(tg, "").strip()
    parts = [p for p in name.split() if p]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[1][0]).upper()


def _clean_body(text: str) -> str:
    cleaned = " ".join(text.strip().split())
    if not cleaned:
        raise ValueError("Сообщение не может быть пустым")
    if len(cleaned) > MAX_CHAT_MESSAGE_CHARS:
        raise ValueError("Сообщение слишком длинное")
    return cleaned


def _serialize(item: ChatMessage, author: User | None, viewer: User) -> dict:
    return {
        "id": str(item.id),
        "author_user_id": str(item.author_user_id),
        "author_role": item.author_role,
        "author_name": _display_name(author),
        "author_username": author.username if author else None,
        "author_initials": _initials(author),
        "author_blocked": bool(author.is_blocked) if author else False,
        "body": item.body,
        "created_at": item.created_at,
        "mine": bool(author is not None and author.id == viewer.id),
    }


def list_recent_messages(db: Session, viewer: User, limit: int = CHAT_HISTORY_LIMIT) -> list[dict]:
    rows = db.scalars(
        select(ChatMessage).order_by(desc(ChatMessage.created_at)).limit(limit)
    ).all()
    rows = list(reversed(rows))

    author_ids = {row.author_user_id for row in rows}
    authors_map: dict = {}
    if author_ids:
        authors = db.scalars(select(User).where(User.id.in_(author_ids))).all()
        authors_map = {a.id: a for a in authors}

    return [_serialize(row, authors_map.get(row.author_user_id), viewer) for row in rows]


def send_message(db: Session, author: User, body: str) -> dict:
    if getattr(author, "is_blocked", False):
        raise ChatBlockedError("Вы заблокированы в чате")

    cleaned = _clean_body(body)

    message = ChatMessage(
        author_user_id=author.id,
        author_role=str(author.role.value if hasattr(author.role, "value") else author.role),
        body=cleaned,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    return _serialize(message, author, author)


def delete_message(db: Session, *, message_id: str, actor: User) -> dict:
    """Удалить сообщение. Доступ: админ/поддержка или автор сообщения."""
    message = db.get(ChatMessage, message_id)
    if message is None:
        raise ChatNotFoundError("Сообщение не найдено")

    is_staff = getattr(actor, "role", None) in {UserRole.admin, UserRole.support} or any(
        getattr(actor, attr, False) for attr in ("is_admin", "is_support")
    )
    if not is_staff and str(message.author_user_id) != str(actor.id):
        raise PermissionError("Недостаточно прав для удаления сообщения")

    db.delete(message)
    db.commit()
    return {"deleted": True, "id": message_id}


def set_user_blocked(db: Session, *, target_user_id: str, blocked: bool) -> dict:
    """Заблокировать/разблокировать пользователя (модерация чата)."""
    target = db.get(User, target_user_id)
    if target is None:
        raise ChatNotFoundError("Пользователь не найден")

    target.is_blocked = bool(blocked)
    db.commit()
    db.refresh(target)
    return {
        "user_id": str(target.id),
        "is_blocked": target.is_blocked,
        "name": _display_name(target),
    }
