from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import String, cast, desc, select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.db import get_db
from app.models.enums import PaymentStatus
from app.models.payment import Payment
from app.models.subscription import Subscription
from app.models.tariff import Tariff
from app.models.user import User
from app.services.payment_service import activate_subscription_for_payment

router = APIRouter(prefix="/admin/payments", tags=["admin"])


class AdminPaymentStatusUpdateIn(BaseModel):
    status: str = Field(pattern="^(pending|succeeded|failed|canceled)$")


@router.get("")
def admin_list_payments(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
    status: str | None = Query(default=None),
    user_query: str | None = Query(default=None),
) -> list[dict]:
    stmt = (
        select(Payment, Tariff, User)
        .join(Tariff, Tariff.id == Payment.tariff_id)
        .join(User, User.id == Payment.user_id)
    )
    if status in {"pending", "succeeded", "failed", "canceled"}:
        stmt = stmt.where(Payment.status == PaymentStatus(status))
    if user_query:
        q = f"%{user_query.lower()}%"
        stmt = stmt.where(
            cast(User.telegram_id, String).like(f"%{user_query}%")
            | User.username.ilike(q)
            | User.first_name.ilike(q)
        )

    rows = db.execute(stmt.order_by(desc(Payment.created_at)).limit(300)).all()
    return [
        {
            "id": str(payment.id),
            "user_id": str(payment.user_id),
            "telegram_id": user.telegram_id,
            "username": user.username,
            "tariff_code": tariff.code,
            "amount_rub": payment.amount_rub,
            "status": payment.status.value,
            "provider_order_id": payment.provider_order_id,
            "created_at": payment.created_at.isoformat() if payment.created_at else None,
        }
        for payment, tariff, user in rows
    ]


@router.patch("/{payment_id}/status")
def admin_update_payment_status(
    payment_id: str,
    payload: AdminPaymentStatusUpdateIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    payment = db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    target = PaymentStatus(payload.status)
    payment.status = target
    if target == PaymentStatus.succeeded:
        activate_subscription_for_payment(db, payment)
        return {"ok": True, "id": str(payment.id), "status": PaymentStatus.succeeded.value}

    if target != PaymentStatus.succeeded:
        payment.paid_at = None if target != PaymentStatus.succeeded else payment.paid_at

    db.add(payment)
    db.commit()
    db.refresh(payment)

    active_subscription = db.scalar(
        select(Subscription)
        .where(Subscription.user_id == payment.user_id)
        .order_by(desc(Subscription.ends_at))
        .limit(1)
    )
    return {
        "ok": True,
        "id": str(payment.id),
        "status": payment.status.value,
        "updated_at": datetime.now(UTC).isoformat(),
        "subscription_id": str(active_subscription.id) if active_subscription else None,
    }
