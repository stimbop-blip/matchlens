from __future__ import annotations

from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.db import get_db
from app.models.enums import PaymentStatus
from app.models.payment import Payment
from app.models.tariff import Tariff
from app.models.user import User
from app.schemas.payment import CreatePaymentIn, CreatePaymentOut, PaymentOut
from app.services.payment_service import activate_subscription_for_payment, create_payment_for_tariff, verify_yoomoney_webhook

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/create", response_model=CreatePaymentOut)
def create_payment(
    payload: CreatePaymentIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CreatePaymentOut:
    if not settings.payments_enabled:
        raise HTTPException(status_code=503, detail="Payments are temporarily disabled")
    payment = create_payment_for_tariff(db, current_user, payload.tariff_code)
    return CreatePaymentOut(
        payment_id=str(payment.id),
        status=payment.status.value,
        amount_rub=payment.amount_rub,
        payment_url=payment.payment_url or "",
    )


@router.get("/my", response_model=list[PaymentOut])
def list_my_payments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[PaymentOut]:
    rows = db.execute(
        select(Payment, Tariff)
        .join(Tariff, Tariff.id == Payment.tariff_id)
        .where(Payment.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
        .limit(50)
    ).all()
    return [
        PaymentOut(
            id=str(payment.id),
            status=payment.status.value,
            amount_rub=payment.amount_rub,
            tariff_code=tariff.code,
            created_at=payment.created_at,
        )
        for payment, tariff in rows
    ]


@router.post("/yoomoney/webhook")
def yoomoney_webhook(
    notification_type: str = Form(...),
    operation_id: str = Form(...),
    amount: str = Form(...),
    currency: str = Form(...),
    datetime_value: str = Form(..., alias="datetime"),
    sender: str = Form(...),
    codepro: str = Form(...),
    label: str = Form(...),
    sha1_hash: str = Form(...),
    db: Session = Depends(get_db),
) -> dict:
    if not settings.payments_enabled:
        return {"ok": True, "message": "Payments disabled"}
    payload = {
        "notification_type": notification_type,
        "operation_id": operation_id,
        "amount": amount,
        "currency": currency,
        "datetime": datetime_value,
        "sender": sender,
        "codepro": codepro,
        "label": label,
        "sha1_hash": sha1_hash,
    }
    if not verify_yoomoney_webhook(payload):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    payment = db.scalar(select(Payment).where(Payment.provider_order_id == label))
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if payment.status == PaymentStatus.succeeded:
        return {"ok": True, "message": "Already processed"}

    payment.provider_payment_id = operation_id
    db.add(payment)
    db.commit()
    db.refresh(payment)

    activate_subscription_for_payment(db, payment)
    return {"ok": True}
