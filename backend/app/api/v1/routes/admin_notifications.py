from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.db import get_db
from app.models.user import User
from app.schemas.notification import AdminBroadcastIn, AdminCampaignPreviewIn, AdminCampaignSendIn, AdminDirectSendIn
from app.services.notification_service import notification_delivery_stats, preview_campaign_recipients, queue_broadcast, queue_campaign, queue_direct_notification

router = APIRouter(prefix="/admin/notifications", tags=["admin"])


@router.post("/broadcast")
def admin_broadcast(
    payload: AdminBroadcastIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    created = queue_broadcast(db, title=payload.title, message=payload.message, access_level=payload.access_level)
    return {"ok": True, "queued": created}


@router.post("/preview")
def admin_campaign_preview(
    payload: AdminCampaignPreviewIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    result = preview_campaign_recipients(
        db,
        segment=payload.segment,
        access_level=payload.access_level,
        notifications_enabled_only=payload.notifications_enabled_only,
    )
    return {"ok": True, **result}


@router.post("/campaign")
def admin_campaign_send(
    payload: AdminCampaignSendIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    result = queue_campaign(
        db,
        title=payload.title,
        message=payload.message,
        segment=payload.segment,
        access_level=payload.access_level,
        notifications_enabled_only=payload.notifications_enabled_only,
    )
    return {"ok": True, **result}


@router.post("/direct")
def admin_direct_send(
    payload: AdminDirectSendIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    result = queue_direct_notification(
        db,
        title=payload.title,
        message=payload.message,
        telegram_id=payload.telegram_id,
        user_id=payload.user_id,
    )
    return {"ok": True, **result}


@router.get("/stats")
def admin_notifications_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    stats = notification_delivery_stats(db)
    return {"ok": True, **stats}
