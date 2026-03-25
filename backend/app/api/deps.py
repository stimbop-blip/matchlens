from __future__ import annotations

import logging

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import get_db
from app.core.security import validate_telegram_init_data_with_reason
from app.models.enums import UserRole
from app.models.user import User
from app.services.user_service import upsert_user_by_telegram

logger = logging.getLogger(__name__)


def get_current_user(
    telegram_init_data: str | None = Header(default=None, alias="X-Telegram-Init-Data"),
    db: Session = Depends(get_db),
) -> User:
    if telegram_init_data is None:
        logger.warning("telegram_auth_failed reason=header_missing")
        raise HTTPException(status_code=401, detail="Missing Telegram initData")

    if not telegram_init_data.strip():
        logger.warning("telegram_auth_failed reason=init_data_empty")
        raise HTTPException(status_code=401, detail="Missing Telegram initData")

    if not settings.bot_token:
        logger.error("telegram_auth_failed reason=invalid_bot_token")
        raise HTTPException(status_code=500, detail="BOT_TOKEN is not configured")

    user_data, reason = validate_telegram_init_data_with_reason(telegram_init_data, settings.bot_token)
    if not user_data:
        logger.warning("telegram_auth_failed reason=%s", reason)
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
