from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models.user import User
from app.schemas.user import MeOut, NotificationSettingsOut, NotificationSettingsUpdateIn, ReferralOut
from app.services.notification_service import get_notification_settings, update_notification_settings
from app.services.referral_service import referral_overview

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=MeOut)
def me(current_user: User = Depends(get_current_user)) -> MeOut:
    return MeOut(
        id=str(current_user.id),
        telegram_id=current_user.telegram_id,
        username=current_user.username,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        role=current_user.role.value,
        is_admin=current_user.role.value == "admin",
    )


@router.get("/me/notification-settings", response_model=NotificationSettingsOut)
def me_notification_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NotificationSettingsOut:
    payload = get_notification_settings(db, current_user)
    return NotificationSettingsOut(**payload)


@router.patch("/me/notification-settings", response_model=NotificationSettingsOut)
def patch_me_notification_settings(
    payload: NotificationSettingsUpdateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NotificationSettingsOut:
    updated = update_notification_settings(db, current_user, payload.model_dump())
    return NotificationSettingsOut(**updated)


@router.get("/me/referral", response_model=ReferralOut)
def me_referral(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReferralOut:
    payload = referral_overview(db, current_user)
    return ReferralOut(**payload)
