from __future__ import annotations

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import get_db
from app.core.security import validate_telegram_init_data
from app.models.enums import UserRole
from app.models.user import User
from app.services.user_service import upsert_user_by_telegram


def get_current_user(
    telegram_init_data: str | None = Header(default=None, alias="X-Telegram-Init-Data"),
    db: Session = Depends(get_db),
) -> User:
    if not telegram_init_data:
        raise HTTPException(status_code=401, detail="Missing Telegram initData")

    user_data = validate_telegram_init_data(telegram_init_data, settings.bot_token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid Telegram initData")

    return upsert_user_by_telegram(
        db,
        {
            "telegram_id": user_data["id"],
            "username": user_data.get("username"),
            "first_name": user_data.get("first_name"),
            "last_name": user_data.get("last_name"),
            "language_code": user_data.get("language_code", "ru"),
        },
    )


def require_admin(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    db_user = db.scalar(select(User).where(User.id == current_user.id))
    if not db_user or db_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return db_user
