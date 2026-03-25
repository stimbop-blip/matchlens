from datetime import datetime

from pydantic import BaseModel, Field


class CreatePaymentIn(BaseModel):
    tariff_code: str = Field(pattern="^(premium|vip)$")


class CreatePaymentOut(BaseModel):
    payment_id: str
    status: str
    amount_rub: int
    payment_url: str


class PaymentOut(BaseModel):
    id: str
    status: str
    amount_rub: int
    tariff_code: str
    created_at: datetime
