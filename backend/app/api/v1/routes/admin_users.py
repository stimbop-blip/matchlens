from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import String, and_, cast, desc, func, select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.db import get_db
from app.models.enums import UserRole
from app.models.payment import Payment
from app.models.subscription import Subscription
from app.models.tariff import Tariff
from app.models.user import User

router = APIRouter(prefix="/admin/users", tags=["admin"])


class AdminUserRoleUpdateIn(BaseModel):
    role: str = Field(pattern="^(user|admin)$")


@router.get("")
def admin_list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
    q: str | None = Query(default=None),
    role: str | None = Query(default=None),
) -> list[dict]:
    stmt = select(User)
    conditions = []
    if q:
        q_like = f"%{q.lower()}%"
        conditions.append(
            (func.lower(func.coalesce(User.username, "")).like(q_like))
            | (cast(User.telegram_id, String).like(f"%{q}%"))
            | (func.lower(func.coalesce(User.first_name, "")).like(q_like))
        )
    if role in {"user", "admin"}:
        conditions.append(User.role == UserRole(role))
    if conditions:
        stmt = stmt.where(and_(*conditions))

    rows = db.scalars(stmt.order_by(desc(User.created_at)).limit(300)).all()


    result: list[dict] = []
    for item in rows:
        sub = db.execute(
            select(Subscription, Tariff)
            .join(Tariff, Tariff.id == Subscription.tariff_id)
            .where(Subscription.user_id == item.id)
            .order_by(desc(Subscription.ends_at))
            .limit(1)
        ).first()
        tariff_code = "free"
        subscription_ends_at = None
        if sub:
            subscription, tariff = sub
            tariff_code = tariff.code
            subscription_ends_at = subscription.ends_at.isoformat() if subscription.ends_at else None

        result.append(
            {
                "id": str(item.id),
                "telegram_id": item.telegram_id,
                "username": item.username,
                "first_name": item.first_name,
                "role": item.role.value,
                "tariff": tariff_code,
                "subscription_ends_at": subscription_ends_at,
                "created_at": item.created_at.isoformat() if item.created_at else None,
                "is_blocked": False,
            }
        )

    return result


@router.patch("/{user_id}/role")
def admin_update_user_role(
    user_id: str,
    payload: AdminUserRoleUpdateIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = UserRole(payload.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"ok": True, "id": str(user.id), "role": user.role.value}


@router.delete("/{user_id}")
def admin_delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    has_payments = db.scalar(select(func.count(Payment.id)).where(Payment.user_id == user.id)) or 0
    has_subscriptions = db.scalar(select(func.count(Subscription.id)).where(Subscription.user_id == user.id)) or 0
    if has_payments or has_subscriptions:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete user with payment/subscription history",
        )

    db.delete(user)
    db.commit()
    return {"ok": True, "deleted_at": datetime.now(UTC).isoformat()}
