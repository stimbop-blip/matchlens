from datetime import datetime

from pydantic import BaseModel, Field


class PromoApplyIn(BaseModel):
    code: str = Field(min_length=3, max_length=32)
    tariff_code: str | None = Field(default=None, pattern="^(free|premium|vip)$")


class PromoApplyOut(BaseModel):
    ok: bool
    mode: str
    kind: str
    code: str
    message: str
    tariff_code: str | None = None
    discount_rub: int | None = None
    final_price_rub: int | None = None
    bonus_days: int | None = None


class AdminPromoCodeCreateIn(BaseModel):
    code: str = Field(min_length=3, max_length=32)
    title: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    kind: str = Field(pattern="^(percent_discount|fixed_discount|extra_days|free_access)$")
    value: int = Field(default=0, ge=0, le=100000)
    tariff_code: str | None = Field(default=None, pattern="^(free|premium|vip)$")
    max_activations: int | None = Field(default=None, ge=1, le=100000)
    expires_at: datetime | None = None
    is_active: bool = True


class AdminPromoCodeUpdateIn(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    kind: str | None = Field(default=None, pattern="^(percent_discount|fixed_discount|extra_days|free_access)$")
    value: int | None = Field(default=None, ge=0, le=100000)
    tariff_code: str | None = Field(default=None, pattern="^(free|premium|vip)$")
    max_activations: int | None = Field(default=None, ge=1, le=100000)
    expires_at: datetime | None = None
    is_active: bool | None = None


class AdminPromoCodeOut(BaseModel):
    id: str
    code: str
    title: str
    description: str | None
    kind: str
    value: int
    tariff_code: str | None
    max_activations: int | None
    activations: int
    is_active: bool
    expires_at: datetime | None
