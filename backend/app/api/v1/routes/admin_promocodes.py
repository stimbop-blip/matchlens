from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.db import get_db
from app.models.promo_code import PromoCode
from app.models.promo_code_activation import PromoCodeActivation
from app.models.user import User
from app.schemas.promo import AdminPromoCodeCreateIn, AdminPromoCodeOut, AdminPromoCodeUpdateIn
from app.services.promo_service import normalize_promo_code

router = APIRouter(prefix="/admin/promocodes", tags=["admin"])


def _promo_out(db: Session, promo: PromoCode) -> AdminPromoCodeOut:
    activations = int(
        db.scalar(select(func.count(PromoCodeActivation.id)).where(PromoCodeActivation.promo_code_id == promo.id)) or 0
    )
    return AdminPromoCodeOut(
        id=str(promo.id),
        code=promo.code,
        title=promo.title,
        description=promo.description,
        kind=promo.kind,
        value=promo.value,
        tariff_code=promo.tariff_code,
        max_activations=promo.max_activations,
        activations=activations,
        is_active=promo.is_active,
        expires_at=promo.expires_at,
    )


@router.get("", response_model=list[AdminPromoCodeOut])
def admin_list_promocodes(db: Session = Depends(get_db), _: User = Depends(require_admin)) -> list[AdminPromoCodeOut]:
    rows = db.scalars(select(PromoCode).order_by(PromoCode.created_at.desc()).limit(200)).all()
    return [_promo_out(db, item) for item in rows]


@router.post("", response_model=AdminPromoCodeOut)
def admin_create_promocode(
    payload: AdminPromoCodeCreateIn,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> AdminPromoCodeOut:
    normalized = normalize_promo_code(payload.code)
    if not normalized:
        raise HTTPException(status_code=400, detail="Некорректный код")
    exists = db.scalar(select(PromoCode.id).where(PromoCode.code == normalized))
    if exists:
        raise HTTPException(status_code=409, detail="Промокод уже существует")

    item = PromoCode(
        code=normalized,
        title=payload.title.strip(),
        description=payload.description,
        kind=payload.kind,
        value=payload.value,
        tariff_code=payload.tariff_code,
        max_activations=payload.max_activations,
        is_active=payload.is_active,
        expires_at=payload.expires_at,
        created_by=admin_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _promo_out(db, item)


@router.patch("/{promo_id}", response_model=AdminPromoCodeOut)
def admin_update_promocode(
    promo_id: str,
    payload: AdminPromoCodeUpdateIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> AdminPromoCodeOut:
    item = db.get(PromoCode, promo_id)
    if not item:
        raise HTTPException(status_code=404, detail="Промокод не найден")

    data = payload.model_dump(exclude_none=True)
    for key, value in data.items():
        setattr(item, key, value)

    db.add(item)
    db.commit()
    db.refresh(item)
    return _promo_out(db, item)


@router.delete("/{promo_id}")
def admin_delete_promocode(
    promo_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    item = db.get(PromoCode, promo_id)
    if not item:
        raise HTTPException(status_code=404, detail="Промокод не найден")
    db.execute(delete(PromoCodeActivation).where(PromoCodeActivation.promo_code_id == item.id))
    db.delete(item)
    db.commit()
    return {"ok": True}
