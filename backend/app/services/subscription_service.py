from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.subscription import Subscription
from app.models.tariff import Tariff
from app.models.user import User


def get_current_subscription_by_telegram_id(db: Session, telegram_id: int) -> dict:
    user = db.scalar(select(User).where(User.telegram_id == telegram_id))
    if not user:
        return {"tariff": "free", "status": "inactive", "ends_at": None}

    row = db.execute(
        select(Subscription, Tariff)
        .join(Tariff, Tariff.id == Subscription.tariff_id)
        .where(Subscription.user_id == user.id)
        .order_by(desc(Subscription.ends_at))
        .limit(1)
    ).first()

    if not row:
        return {"tariff": "free", "status": "inactive", "ends_at": None}

    subscription, tariff = row
    if subscription.ends_at < datetime.now(UTC):
        return {"tariff": "free", "status": "expired", "ends_at": subscription.ends_at.isoformat()}

    return {
        "tariff": tariff.code,
        "status": subscription.status.value,
        "ends_at": subscription.ends_at.isoformat(),
    }
