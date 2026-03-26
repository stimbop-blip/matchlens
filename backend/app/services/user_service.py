from __future__ import annotations

import secrets
import string

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import UserRole
from app.models.user import User

_REF_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def _generate_referral_code(db: Session) -> str:
    for _ in range(50):
        code = "".join(secrets.choice(_REF_CODE_ALPHABET) for _ in range(8))
        exists = db.scalar(select(User.id).where(User.referral_code == code))
        if not exists:
            return code

    suffix = secrets.token_hex(6).upper()
    return f"PB{suffix}"


def _normalize_referral_code(value: str | None) -> str | None:
    if not value:
        return None
    allowed = set(string.ascii_letters + string.digits)
    cleaned = "".join(char for char in value.strip() if char in allowed).upper()
    return cleaned or None


def upsert_user_by_telegram(db: Session, payload: dict) -> User:
    telegram_id = payload["telegram_id"]
    admin_ids = {item.strip() for item in settings.admin_telegram_ids.split(",") if item.strip()}
    role = UserRole.admin if str(telegram_id) in admin_ids else UserRole.user
    referral_code = _normalize_referral_code(payload.get("referral_code"))

    user = db.scalar(select(User).where(User.telegram_id == telegram_id))
    if user:
        user.username = payload.get("username")
        user.first_name = payload.get("first_name")
        user.last_name = payload.get("last_name")
        user.language_code = payload.get("language_code") or "ru"
        user.role = role

        if not user.referral_code:
            user.referral_code = _generate_referral_code(db)

        if referral_code and not user.referred_by_user_id and referral_code != user.referral_code:
            referrer = db.scalar(select(User).where(User.referral_code == referral_code))
            if referrer and referrer.id != user.id:
                user.referred_by_user_id = referrer.id

        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    referred_by_user_id = None
    if referral_code:
        referrer = db.scalar(select(User).where(User.referral_code == referral_code))
        if referrer:
            referred_by_user_id = referrer.id

    user = User(
        telegram_id=telegram_id,
        username=payload.get("username"),
        first_name=payload.get("first_name"),
        last_name=payload.get("last_name"),
        language_code=payload.get("language_code") or "ru",
        role=role,
        referral_code=_generate_referral_code(db),
        referred_by_user_id=referred_by_user_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
