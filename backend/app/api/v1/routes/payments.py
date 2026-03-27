from __future__ import annotations

from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.db import get_db
from app.models.enums import PaymentStatus
from app.models.payment import Payment
from app.models.payment_method import PaymentMethod
from app.models.tariff import Tariff
from app.models.user import User
from app.schemas.payment import (
    CreatePaymentIn,
    CreatePaymentOut,
    ManualPaymentConfirmIn,
    PaymentMethodOut,
    PaymentOut,
    PaymentQuoteIn,
    PaymentQuoteOut,
)
from app.services.payment_service import (
    activate_subscription_for_payment,
    confirm_manual_payment,
    create_payment_for_tariff,
    list_active_payment_methods,
    quote_payment_for_tariff,
    verify_yoomoney_webhook,
)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("/methods", response_model=list[PaymentMethodOut])
def list_payment_methods(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[PaymentMethodOut]:
    methods = list_active_payment_methods(db)
    return [
        PaymentMethodOut(
            code=item.code,
            name=item.name,
            method_type=item.method_type,
            is_active=item.is_active,
            sort_order=item.sort_order,
            card_number=item.card_number,
            recipient_name=item.recipient_name,
            payment_details=item.payment_details,
            instructions=item.instructions,
        )
        for item in methods
    ]


@router.post("/quote", response_model=PaymentQuoteOut)
def quote_payment(
    payload: PaymentQuoteIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaymentQuoteOut:
    try:
        quote = quote_payment_for_tariff(db, current_user, payload.tariff_code, payload.duration_days, payload.promo_code)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return PaymentQuoteOut(**quote)


@router.post("/create", response_model=CreatePaymentOut)
def create_payment(
    payload: CreatePaymentIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CreatePaymentOut:
    try:
        method = db.scalar(select(PaymentMethod).where(PaymentMethod.code == payload.payment_method_code)) if payload.payment_method_code else None
        if method and method.method_type == "auto" and not settings.payments_enabled:
            raise HTTPException(status_code=503, detail="Automatic payments are temporarily disabled")

        payment, quote, payment_method = create_payment_for_tariff(
            db,
            current_user,
            payload.tariff_code,
            payload.duration_days,
            payload.payment_method_code,
            payload.promo_code,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return CreatePaymentOut(
        payment_id=str(payment.id),
        status=payment.status.value,
        amount_rub=payment.amount_rub,
        original_amount_rub=int(quote.get("original_amount_rub") or payment.amount_rub),
        discount_rub=int(quote.get("discount_rub") or 0),
        applied_discount_source=quote.get("applied_discount_source"),
        promo_code=quote.get("promo_code"),
        promo_message=quote.get("message"),
        tariff_code=payload.tariff_code,
        duration_days=int(quote.get("duration_days") or payload.duration_days),
        access_level=str(quote.get("access_level") or payload.tariff_code),
        payment_method_code=payment_method.code,
        payment_method_name=payment_method.name,
        payment_method_type=payment_method.method_type,
        payment_url=payment.payment_url,
        instructions=payment_method.instructions,
        card_number=payment_method.card_number,
        recipient_name=payment_method.recipient_name,
        payment_details=payment_method.payment_details,
    )


@router.post("/{payment_id}/manual-confirm", response_model=PaymentOut)
def confirm_manual_payment_route(
    payment_id: str,
    payload: ManualPaymentConfirmIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaymentOut:
    payment = db.get(Payment, payment_id)
    if not payment or str(payment.user_id) != str(current_user.id):
        raise HTTPException(status_code=404, detail="Payment not found")

    if payment.method_code == "yoomoney":
        raise HTTPException(status_code=400, detail="This payment method does not require manual confirmation")

    try:
        updated = confirm_manual_payment(
            db,
            payment,
            transfer_reference=payload.transfer_reference,
            note=payload.note,
            proof=payload.proof,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    tariff = db.scalar(select(Tariff).where(Tariff.id == updated.tariff_id))
    return PaymentOut(
        id=str(updated.id),
        status=updated.status.value,
        amount_rub=updated.amount_rub,
        tariff_code=tariff.code if tariff else updated.access_level_snapshot,
        duration_days=updated.duration_days_snapshot,
        payment_method_code=updated.method_code,
        payment_method_name=updated.method_name_snapshot,
        manual_note=updated.manual_note,
        manual_proof=updated.manual_proof,
        review_comment=updated.review_comment,
        created_at=updated.created_at,
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
            duration_days=payment.duration_days_snapshot,
            payment_method_code=payment.method_code,
            payment_method_name=payment.method_name_snapshot,
            manual_note=payment.manual_note,
            manual_proof=payment.manual_proof,
            review_comment=payment.review_comment,
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
