from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_admin, require_admin_or_support
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
    try:
        created = queue_broadcast(
            db,
            title=payload.title,
            message=payload.message,
            access_level=payload.access_level,
            button_text=payload.button_text,
            button_url=payload.button_url_str(),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
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
    preview_payload = {
        "title": payload.title,
        "message": payload.message,
        "button_text": payload.button_text,
        "button_url": payload.button_url_str(),
    }
    if not any(preview_payload.values()):
        preview_payload = None

    return {
        "ok": True,
        **result,
        "preview": preview_payload,
    }


@router.post("/campaign")
def admin_campaign_send(
    payload: AdminCampaignSendIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    try:
        result = queue_campaign(
            db,
            title=payload.title,
            message=payload.message,
            segment=payload.segment,
            access_level=payload.access_level,
            notifications_enabled_only=payload.notifications_enabled_only,
            button_text=payload.button_text,
            button_url=payload.button_url_str(),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"ok": True, **result}


@router.post("/direct")
def admin_direct_send(
    payload: AdminDirectSendIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_support),
) -> dict:
    try:
        result = queue_direct_notification(
            db,
            title=payload.title,
            message=payload.message,
            telegram_id=payload.telegram_id,
            user_id=payload.user_id,
            button_text=payload.button_text,
            button_url=payload.button_url_str(),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"ok": True, **result}


@router.get("/stats")
def admin_notifications_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_support),
) -> dict:
    stats = notification_delivery_stats(db)
    return {"ok": True, **stats}
