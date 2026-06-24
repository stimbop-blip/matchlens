from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.api.deps import require_admin_or_support
from app.core.db import get_db
from app.models.ad_campaign import AdCampaign
from app.models.user import User
from app.schemas.ad import AdOut, AdminAdCreateIn, AdminAdUpdateIn

router = APIRouter(prefix="/admin/ads", tags=["admin"])


def _serialize(item: AdCampaign) -> AdOut:
    return AdOut(
        id=str(item.id),
        title=item.title,
        body=item.body,
        image_url=item.image_url,
        cta_text=item.cta_text,
        cta_url=item.cta_url,
        is_active=item.is_active,
        sort_order=item.sort_order,
        created_at=item.created_at,
    )


@router.get("", response_model=list[AdOut])
def admin_list_ads(db: Session = Depends(get_db), _: User = Depends(require_admin_or_support)) -> list[AdOut]:
    rows = db.scalars(
        select(AdCampaign).order_by(desc(AdCampaign.created_at)).limit(200)
    ).all()
    return [_serialize(item) for item in rows]


@router.post("", response_model=AdOut)
def admin_create_ad(
    payload: AdminAdCreateIn,
    db: Session = Depends(get_db),
    actor: User = Depends(require_admin_or_support),
) -> AdOut:
    item = AdCampaign(
        title=payload.title.strip(),
        body=payload.body.strip(),
        image_url=(payload.image_url.strip() if payload.image_url else None),
        cta_text=(payload.cta_text.strip() if payload.cta_text else None),
        cta_url=(payload.cta_url.strip() if payload.cta_url else None),
        is_active=payload.is_active,
        sort_order=payload.sort_order,
        created_by=actor.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _serialize(item)


@router.patch("/{ad_id}", response_model=AdOut)
def admin_update_ad(
    ad_id: str,
    payload: AdminAdUpdateIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_support),
) -> AdOut:
    item = db.get(AdCampaign, ad_id)
    if not item:
        raise HTTPException(status_code=404, detail="Ad not found")

    data = payload.model_dump(exclude_unset=True)
    for field in ("title", "body", "image_url", "cta_text", "cta_url"):
        if field in data and data[field] is not None:
            value = str(data[field]).strip()
            setattr(item, field, value or None if field != "title" and field != "body" else value)
    if "is_active" in data and data["is_active"] is not None:
        item.is_active = bool(data["is_active"])
    if "sort_order" in data and data["sort_order"] is not None:
        item.sort_order = int(data["sort_order"])

    db.add(item)
    db.commit()
    db.refresh(item)
    return _serialize(item)


@router.delete("/{ad_id}")
def admin_delete_ad(
    ad_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_support),
) -> dict:
    item = db.get(AdCampaign, ad_id)
    if not item:
        raise HTTPException(status_code=404, detail="Ad not found")
    db.delete(item)
    db.commit()
    return {"ok": True}
