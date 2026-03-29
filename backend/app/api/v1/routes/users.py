from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models.user import User
from app.schemas.user import (
    ConsentOut,
    ConsentUpdateIn,
    MeOut,
    NotificationSettingsOut,
    NotificationSettingsUpdateIn,
    ReferralOut,
    UserPreferencesOut,
    UserPreferencesUpdateIn,
)
from app.services.notification_service import (
    get_notification_settings,
    get_user_preferences,
    update_notification_settings,
    update_user_preferences,
)
from app.services.referral_service import referral_overview

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=MeOut)
def me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MeOut:
    preferences = get_user_preferences(db, current_user)
    return MeOut(
        id=str(current_user.id),
        telegram_id=current_user.telegram_id,
        username=current_user.username,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        language=preferences["language"],
        theme=preferences["theme"],
        role=current_user.role.value,
        is_admin=current_user.role.value == "admin",
        is_support=current_user.role.value == "support",
        accepted_18_plus=current_user.accepted_18_plus,
        accepted_rules=current_user.accepted_rules,
        accepted_payment_terms=current_user.accepted_payment_terms,
        accepted_at=current_user.accepted_at,
        accepted_version=current_user.accepted_version,
    )


@router.get("/me/consent", response_model=ConsentOut)
def me_consent(
    current_user: User = Depends(get_current_user),
) -> ConsentOut:
    return ConsentOut(
        accepted_18_plus=current_user.accepted_18_plus,
        accepted_rules=current_user.accepted_rules,
        accepted_payment_terms=current_user.accepted_payment_terms,
        accepted_at=current_user.accepted_at,
        accepted_version=current_user.accepted_version,
    )


@router.patch("/me/consent", response_model=ConsentOut)
def patch_me_consent(
    payload: ConsentUpdateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConsentOut:
    current_user.accepted_18_plus = payload.accepted_18_plus
    current_user.accepted_rules = payload.accepted_rules
    current_user.accepted_payment_terms = payload.accepted_payment_terms

    accepted = bool(
        current_user.accepted_18_plus
        and current_user.accepted_rules
        and current_user.accepted_payment_terms
    )
    if accepted:
        current_user.accepted_at = datetime.now(timezone.utc)
        current_user.accepted_version = payload.accepted_version
    else:
        current_user.accepted_at = None
        current_user.accepted_version = None

    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return ConsentOut(
        accepted_18_plus=current_user.accepted_18_plus,
        accepted_rules=current_user.accepted_rules,
        accepted_payment_terms=current_user.accepted_payment_terms,
        accepted_at=current_user.accepted_at,
        accepted_version=current_user.accepted_version,
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


@router.get("/me/preferences", response_model=UserPreferencesOut)
def me_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserPreferencesOut:
    payload = get_user_preferences(db, current_user)
    return UserPreferencesOut(**payload)


@router.patch("/me/preferences", response_model=UserPreferencesOut)
def patch_me_preferences(
    payload: UserPreferencesUpdateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserPreferencesOut:
    updated = update_user_preferences(db, current_user, payload.model_dump(exclude_none=True))
    return UserPreferencesOut(**updated)
