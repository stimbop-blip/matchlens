from datetime import datetime

from pydantic import BaseModel, Field


class CreatePaymentIn(BaseModel):
    tariff_code: str = Field(pattern="^(premium|vip)$")
    promo_code: str | None = None


class CreatePaymentOut(BaseModel):
    payment_id: str
    status: str
    amount_rub: int
    original_amount_rub: int | None = None
    discount_rub: int = 0
    promo_code: str | None = None
    promo_message: str | None = None
    payment_url: str


class PaymentOut(BaseModel):
    id: str
    status: str
    amount_rub: int
    tariff_code: str
    created_at: datetime
