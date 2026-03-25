from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import UserRole
from app.models.user import User


def upsert_user_by_telegram(db: Session, payload: dict) -> User:
    telegram_id = payload["telegram_id"]
    admin_ids = {item.strip() for item in settings.admin_telegram_ids.split(",") if item.strip()}
    role = UserRole.admin if str(telegram_id) in admin_ids else UserRole.user

    user = db.scalar(select(User).where(User.telegram_id == telegram_id))
    if user:
        user.username = payload.get("username")
        user.first_name = payload.get("first_name")
        user.last_name = payload.get("last_name")
        user.language_code = payload.get("language_code") or "ru"
        user.role = role
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    user = User(
        telegram_id=telegram_id,
        username=payload.get("username"),
        first_name=payload.get("first_name"),
        last_name=payload.get("last_name"),
        language_code=payload.get("language_code") or "ru",
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
