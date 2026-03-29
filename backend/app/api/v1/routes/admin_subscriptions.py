from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import String, cast, desc, select
from sqlalchemy.orm import Session

from app.api.deps import require_admin_or_support
from app.core.db import get_db
from app.models.enums import SubscriptionStatus
from app.models.subscription import Subscription
from app.models.tariff import Tariff
from app.models.user import User

router = APIRouter(prefix="/admin/subscriptions", tags=["admin"])


class AdminGrantSubscriptionIn(BaseModel):
    user_id: str | None = None
    telegram_id: int | None = None
    tariff_code: str = Field(pattern="^(free|premium|vip)$")
    duration_days: int = Field(default=30, ge=1, le=365)


class AdminExtendSubscriptionIn(BaseModel):
    days: int = Field(ge=1, le=365)


class AdminChangeTariffIn(BaseModel):
    tariff_code: str = Field(pattern="^(free|premium|vip)$")
    duration_days: int | None = Field(default=None, ge=1, le=365)


@router.get("")
def admin_list_subscriptions(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_support),
    status: str | None = Query(default=None),
    q: str | None = Query(default=None),
) -> list[dict]:
    stmt = (
        select(Subscription, Tariff, User)
        .join(Tariff, Tariff.id == Subscription.tariff_id)
        .join(User, User.id == Subscription.user_id)
    )
    if status in {"active", "expired", "canceled"}:
        stmt = stmt.where(Subscription.status == SubscriptionStatus(status))
    if q:
        q_like = f"%{q.lower()}%"
        stmt = stmt.where(
            cast(User.telegram_id, String).like(f"%{q}%")
            | User.username.ilike(q_like)
            | User.first_name.ilike(q_like)
        )

    rows = db.execute(stmt.order_by(desc(Subscription.created_at)).limit(300)).all()
    return [
        {
            "id": str(sub.id),
            "user_id": str(user.id),
            "telegram_id": user.telegram_id,
            "username": user.username,
            "tariff_code": tariff.code,
            "status": sub.status.value,
            "starts_at": sub.starts_at.isoformat(),
            "ends_at": sub.ends_at.isoformat(),
            "created_at": sub.created_at.isoformat() if sub.created_at else None,
        }
        for sub, tariff, user in rows
    ]


@router.post("/grant")
def admin_grant_subscription(
    payload: AdminGrantSubscriptionIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_support),
) -> dict:
    user: User | None = None
    if payload.user_id:
        user = db.get(User, payload.user_id)
    elif payload.telegram_id:
        user = db.scalar(select(User).where(User.telegram_id == payload.telegram_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    tariff = db.scalar(select(Tariff).where(Tariff.code == payload.tariff_code, Tariff.is_active.is_(True)))
    if not tariff:
        raise HTTPException(status_code=404, detail="Tariff not found")

    now = datetime.now(UTC)
    starts_at = now
    active = db.scalar(
        select(Subscription)
        .where(Subscription.user_id == user.id, Subscription.status == SubscriptionStatus.active)
        .order_by(desc(Subscription.ends_at))
        .limit(1)
    )
    if active and active.ends_at > now:
        starts_at = active.ends_at
        active.status = SubscriptionStatus.expired
        db.add(active)

    item = Subscription(
        user_id=user.id,
        tariff_id=tariff.id,
        status=SubscriptionStatus.active,
        starts_at=starts_at,
        ends_at=starts_at + timedelta(days=payload.duration_days),
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return {
        "ok": True,
        "id": str(item.id),
        "user_id": str(user.id),
        "tariff_code": tariff.code,
        "status": item.status.value,
        "ends_at": item.ends_at.isoformat(),
    }


@router.patch("/{subscription_id}/extend")
def admin_extend_subscription(
    subscription_id: str,
    payload: AdminExtendSubscriptionIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_support),
) -> dict:
    item = db.get(Subscription, subscription_id)
    if not item:
        raise HTTPException(status_code=404, detail="Subscription not found")

    item.ends_at = item.ends_at + timedelta(days=payload.days)
    if item.status != SubscriptionStatus.canceled:
        item.status = SubscriptionStatus.active
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"ok": True, "id": str(item.id), "ends_at": item.ends_at.isoformat(), "status": item.status.value}


@router.patch("/{subscription_id}/tariff")
def admin_change_subscription_tariff(
    subscription_id: str,
    payload: AdminChangeTariffIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_support),
) -> dict:
    item = db.get(Subscription, subscription_id)
    if not item:
        raise HTTPException(status_code=404, detail="Subscription not found")

    tariff = db.scalar(select(Tariff).where(Tariff.code == payload.tariff_code, Tariff.is_active.is_(True)))
    if not tariff:
        raise HTTPException(status_code=404, detail="Tariff not found")

    item.tariff_id = tariff.id
    if payload.duration_days:
        item.ends_at = datetime.now(UTC) + timedelta(days=payload.duration_days)
    db.add(item)
    db.commit()
    db.refresh(item)
    return {
        "ok": True,
        "id": str(item.id),
        "tariff_code": tariff.code,
        "status": item.status.value,
        "ends_at": item.ends_at.isoformat(),
    }


@router.patch("/{subscription_id}/cancel")
def admin_cancel_subscription(
    subscription_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_support),
) -> dict:
    item = db.get(Subscription, subscription_id)
    if not item:
        raise HTTPException(status_code=404, detail="Subscription not found")

    now = datetime.now(UTC)
    item.status = SubscriptionStatus.canceled
    item.ends_at = now
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"ok": True, "id": str(item.id), "status": item.status.value, "ends_at": item.ends_at.isoformat()}
