from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import asc, select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.db import get_db
from app.models.payment_method import PaymentMethod
from app.models.user import User
from app.schemas.payment import AdminPaymentMethodCreateIn, AdminPaymentMethodUpdateIn, PaymentMethodOut

router = APIRouter(prefix="/admin/payment-methods", tags=["admin"])


@router.get("", response_model=list[PaymentMethodOut])
def admin_list_payment_methods(db: Session = Depends(get_db), _: User = Depends(require_admin)) -> list[PaymentMethodOut]:
    rows = db.scalars(select(PaymentMethod).order_by(asc(PaymentMethod.sort_order), asc(PaymentMethod.created_at))).all()
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
        for item in rows
    ]


@router.post("", response_model=PaymentMethodOut)
def admin_create_payment_method(
    payload: AdminPaymentMethodCreateIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> PaymentMethodOut:
    existing = db.scalar(select(PaymentMethod).where(PaymentMethod.code == payload.code))
    if existing:
        raise HTTPException(status_code=409, detail="Payment method code already exists")

    item = PaymentMethod(
        code=payload.code.strip(),
        name=payload.name.strip(),
        method_type=payload.method_type,
        is_active=payload.is_active,
        sort_order=payload.sort_order,
        card_number=payload.card_number,
        recipient_name=payload.recipient_name,
        payment_details=payload.payment_details,
        instructions=payload.instructions,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return PaymentMethodOut(
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


@router.patch("/{method_code}", response_model=PaymentMethodOut)
def admin_update_payment_method(
    method_code: str,
    payload: AdminPaymentMethodUpdateIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> PaymentMethodOut:
    item = db.scalar(select(PaymentMethod).where(PaymentMethod.code == method_code))
    if not item:
        raise HTTPException(status_code=404, detail="Payment method not found")

    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        if isinstance(value, str):
            setattr(item, key, value.strip())
        else:
            setattr(item, key, value)

    db.add(item)
    db.commit()
    db.refresh(item)
    return PaymentMethodOut(
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
