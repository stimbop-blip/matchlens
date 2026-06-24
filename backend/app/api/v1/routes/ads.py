from fastapi import APIRouter, Depends
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.ad_campaign import AdCampaign
from app.schemas.ad import AdOut

router = APIRouter(prefix="/ads", tags=["ads"])


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


@router.get("/active", response_model=list[AdOut])
def list_active_ads(db: Session = Depends(get_db)) -> list[AdOut]:
    """Публичный список активных рекламных кампаний для popup подарка."""
    rows = db.scalars(
        select(AdCampaign)
        .where(AdCampaign.is_active.is_(True))
        .order_by(AdCampaign.sort_order.asc(), desc(AdCampaign.created_at))
        .limit(10)
    ).all()
    return [_serialize(item) for item in rows]
