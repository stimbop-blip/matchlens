from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import get_db
from app.core.security import validate_telegram_init_data
from app.schemas.auth import AuthResponse, TelegramInitDataIn
from app.services.user_service import upsert_user_by_telegram

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/telegram", response_model=AuthResponse)
def auth_telegram(payload: TelegramInitDataIn, db: Session = Depends(get_db)) -> AuthResponse:
    if not settings.bot_token:
        raise HTTPException(status_code=500, detail="BOT_TOKEN is not configured")

    user_data = validate_telegram_init_data(payload.init_data, settings.bot_token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid telegram initData")

    user = upsert_user_by_telegram(
        db,
        {
            "telegram_id": user_data["id"],
            "username": user_data.get("username"),
            "first_name": user_data.get("first_name"),
            "last_name": user_data.get("last_name"),
            "language_code": user_data.get("language_code", "ru"),
        },
    )
    return AuthResponse(
        user_id=str(user.id),
        telegram_id=user.telegram_id,
        role=user.role.value,
        is_admin=user.role.value == "admin",
    )
