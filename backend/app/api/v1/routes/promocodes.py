from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models.user import User
from app.schemas.promo import PromoApplyIn, PromoApplyOut
from app.services.promo_service import apply_promo_code

router = APIRouter(prefix="/promocodes", tags=["promocodes"])


@router.post("/apply", response_model=PromoApplyOut)
def user_apply_promocode(
    payload: PromoApplyIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PromoApplyOut:
    try:
        result = apply_promo_code(db, current_user, payload.code, payload.tariff_code)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return PromoApplyOut(**result)
