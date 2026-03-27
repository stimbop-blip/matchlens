from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import SubscriptionStatus
from app.models.referral_bonus import ReferralBonus
from app.models.subscription import Subscription
from app.models.tariff import Tariff
from app.models.user import User
from app.services.user_service import _generate_referral_code

logger = logging.getLogger(__name__)


def ensure_referral_code(db: Session, user: User) -> str:
    if user.referral_code:
        return user.referral_code
    user.referral_code = _generate_referral_code(db)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user.referral_code


def _referral_link(code: str) -> str:
    bot_username = settings.bot_username.strip("@ ")
    return f"https://t.me/{bot_username}?start=ref_{code}"


def referral_overview(db: Session, user: User) -> dict:
    code = ensure_referral_code(db, user)
    invited_count = int(db.scalar(select(func.count(User.id)).where(User.referred_by_user_id == user.id)) or 0)

    activated_count = int(
        db.scalar(select(func.count(distinct(ReferralBonus.referred_user_id))).where(ReferralBonus.referrer_user_id == user.id))
        or 0
    )

    bonus_days = int(
        db.scalar(select(func.coalesce(func.sum(ReferralBonus.bonus_days), 0)).where(ReferralBonus.referrer_user_id == user.id))
        or 0
    )

    return {
        "referral_code": code,
        "referral_link": _referral_link(code),
        "invited": invited_count,
        "activated": activated_count,
        "bonus_days": bonus_days,
    }


def apply_referral_bonus_on_activation(db: Session, activated_user: User, bonus_days: int = 7) -> bool:
    if not activated_user.referred_by_user_id:
        return False

    already_applied = db.scalar(select(ReferralBonus.id).where(ReferralBonus.referred_user_id == activated_user.id))
    if already_applied:
        return False

    referrer = db.get(User, activated_user.referred_by_user_id)
    if not referrer:
        return False

    premium_tariff = db.scalar(select(Tariff).where(Tariff.code == "premium", Tariff.is_active.is_(True)))
    if not premium_tariff:
        logger.warning("referral_bonus skipped reason=premium_tariff_missing")
        return False

    now = datetime.now(UTC)
    active_referrer_sub = db.scalar(
        select(Subscription)
        .where(Subscription.user_id == referrer.id, Subscription.status == SubscriptionStatus.active)
        .order_by(Subscription.ends_at.desc())
        .limit(1)
    )
    if active_referrer_sub and active_referrer_sub.ends_at > now:
        active_referrer_sub.ends_at = active_referrer_sub.ends_at + timedelta(days=bonus_days)
        db.add(active_referrer_sub)
    else:
        db.add(
            Subscription(
                user_id=referrer.id,
                tariff_id=premium_tariff.id,
                status=SubscriptionStatus.active,
                starts_at=now,
                ends_at=now + timedelta(days=bonus_days),
            )
        )

    db.add(
        ReferralBonus(
            referrer_user_id=referrer.id,
            referred_user_id=activated_user.id,
            bonus_days=bonus_days,
        )
    )
    logger.info(
        "referral_bonus queued referrer_user_id=%s referred_user_id=%s bonus_days=%s",
        referrer.id,
        activated_user.id,
        bonus_days,
    )
    return True
