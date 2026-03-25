from pydantic import BaseModel


class TariffOut(BaseModel):
    code: str
    name: str
    price_rub: int
    duration_days: int
    access_level: str
    description: str | None
