from datetime import datetime

from pydantic import BaseModel, Field, field_validator


def _validate_duration(value: int) -> int:
    if value not in {7, 30, 90}:
        raise ValueError("duration_days must be 7, 30, or 90")
    return value


class PaymentMethodOut(BaseModel):
    code: str
    name: str
    method_type: str
    is_active: bool
    sort_order: int
    card_number: str | None = None
    recipient_name: str | None = None
    payment_details: str | None = None
    instructions: str | None = None


class PaymentQuoteIn(BaseModel):
    tariff_code: str = Field(pattern="^(premium|vip)$")
    duration_days: int = Field(default=30, ge=1, le=365)
    promo_code: str | None = None

    _duration_check = field_validator("duration_days")(_validate_duration)


class PaymentQuoteOut(BaseModel):
    tariff_code: str
    duration_days: int
    access_level: str
    original_amount_rub: int
    final_amount_rub: int
    discount_rub: int
    applied_discount_source: str | None = None
    promo_code: str | None = None
    message: str | None = None


class CreatePaymentIn(BaseModel):
    tariff_code: str = Field(pattern="^(premium|vip)$")
    duration_days: int = Field(default=30, ge=1, le=365)
    payment_method_code: str | None = None
    promo_code: str | None = None

    _duration_check = field_validator("duration_days")(_validate_duration)


class CreatePaymentOut(BaseModel):
    payment_id: str
    status: str
    amount_rub: int
    original_amount_rub: int
    discount_rub: int = 0
    applied_discount_source: str | None = None
    promo_code: str | None = None
    promo_message: str | None = None
    tariff_code: str
    duration_days: int
    access_level: str
    payment_method_code: str
    payment_method_name: str
    payment_method_type: str
    payment_url: str | None = None
    instructions: str | None = None
    card_number: str | None = None
    recipient_name: str | None = None
    payment_details: str | None = None


class ManualPaymentConfirmIn(BaseModel):
    transfer_reference: str | None = None
    note: str | None = None
    proof: str | None = None


class PaymentOut(BaseModel):
    id: str
    status: str
    amount_rub: int
    tariff_code: str
    duration_days: int
    payment_method_code: str | None = None
    payment_method_name: str | None = None
    manual_note: str | None = None
    manual_proof: str | None = None
    review_comment: str | None = None
    created_at: datetime


class AdminPaymentMethodCreateIn(BaseModel):
    code: str = Field(min_length=2, max_length=40)
    name: str = Field(min_length=2, max_length=120)
    method_type: str = Field(pattern="^(auto|manual)$")
    is_active: bool = True
    sort_order: int = 100
    card_number: str | None = None
    recipient_name: str | None = None
    payment_details: str | None = None
    instructions: str | None = None


class AdminPaymentMethodUpdateIn(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    method_type: str | None = Field(default=None, pattern="^(auto|manual)$")
    is_active: bool | None = None
    sort_order: int | None = None
    card_number: str | None = None
    recipient_name: str | None = None
    payment_details: str | None = None
    instructions: str | None = None


class AdminPaymentStatusUpdateIn(BaseModel):
    status: str = Field(pattern="^(pending|pending_manual_review|requires_clarification|succeeded|failed|canceled)$")
    review_comment: str | None = None
