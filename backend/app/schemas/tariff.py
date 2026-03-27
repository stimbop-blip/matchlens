from pydantic import BaseModel, Field


class TariffOptionOut(BaseModel):
    duration_days: int
    price_rub: int
    badge: str | None = None
    benefit_label: str | None = None


class TariffOut(BaseModel):
    code: str
    name: str
    price_rub: int
    duration_days: int
    access_level: str
    description: str | None
    perks: list[str] = Field(default_factory=list)
    options: list[TariffOptionOut] = Field(default_factory=list)
