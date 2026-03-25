from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.tariff import Tariff
from app.schemas.tariff import TariffOut

router = APIRouter(prefix="/tariffs", tags=["tariffs"])


@router.get("", response_model=list[TariffOut])
def list_tariffs(db: Session = Depends(get_db)) -> list[TariffOut]:
    records = db.scalars(select(Tariff).where(Tariff.is_active.is_(True)).order_by(Tariff.price_rub.asc())).all()
    return [
        TariffOut(
            code=item.code,
            name=item.name,
            price_rub=item.price_rub,
            duration_days=item.duration_days,
            access_level=item.access_level.value,
            description=item.description,
        )
        for item in records
    ]
