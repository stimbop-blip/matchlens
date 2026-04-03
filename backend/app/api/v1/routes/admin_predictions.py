from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.db import get_db
from app.models.prediction import Prediction
from app.models.user import User
from app.schemas.prediction import PredictionCreateIn, PredictionOut, PredictionUpdateIn
from app.services.notification_service import queue_prediction_created_notification, queue_prediction_result_notification
from app.services.prediction_service import create_prediction, delete_prediction, update_prediction

router = APIRouter(prefix="/admin/predictions", tags=["admin"])


def _prediction_out(item: Prediction) -> PredictionOut:
    return PredictionOut(
        id=str(item.id),
        title=item.title,
        match_name=item.match_name,
        league=item.league,
        sport_type=item.sport_type,
        event_start_at=item.event_start_at,
        signal_type=item.signal_type,
        odds=float(item.odds),
        short_description=item.short_description,
        bet_screenshot=item.bet_screenshot,
        result_screenshot=item.result_screenshot,
        risk_level=item.risk_level,
        access_level=item.access_level.value,
        status=item.status.value,
        mode=item.mode,
        published_at=item.published_at,
    )


@router.get("", response_model=list[PredictionOut])
def admin_list_predictions(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[PredictionOut]:
    rows = db.scalars(select(Prediction).order_by(desc(Prediction.created_at)).limit(200)).all()
    return [_prediction_out(item) for item in rows]


@router.post("", response_model=PredictionOut)
def admin_create_prediction(
    payload: PredictionCreateIn,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> PredictionOut:
    item = create_prediction(db, payload.model_dump(), str(current_admin.id))
    if item.published_at is not None and payload.notify_subscribers:
        queue_prediction_created_notification(db, item)
    return _prediction_out(item)


@router.put("/{prediction_id}", response_model=PredictionOut)
def admin_update_prediction(
    prediction_id: str,
    payload: PredictionUpdateIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> PredictionOut:
    item = db.get(Prediction, prediction_id)
    if not item:
        raise HTTPException(status_code=404, detail="Prediction not found")
    previous_published_at = item.published_at
    previous_status = item.status.value
    previous_has_result_screenshot = bool((item.result_screenshot or "").strip())
    notify_subscribers = True if payload.notify_subscribers is None else bool(payload.notify_subscribers)
    item = update_prediction(db, item, payload.model_dump())
    if notify_subscribers and previous_published_at is None and item.published_at is not None:
        queue_prediction_created_notification(db, item)

    result_statuses = {"won", "lost", "refund"}
    status_changed_to_result = item.status.value in result_statuses and previous_status != item.status.value
    screenshot_added_for_result = (
        item.status.value in result_statuses
        and not previous_has_result_screenshot
        and bool((item.result_screenshot or "").strip())
    )
    if notify_subscribers and (status_changed_to_result or screenshot_added_for_result):
        queue_prediction_result_notification(db, item)
    return _prediction_out(item)


@router.delete("/{prediction_id}")
def admin_delete_prediction(
    prediction_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    item = db.get(Prediction, prediction_id)
    if not item:
        raise HTTPException(status_code=404, detail="Prediction not found")
    delete_prediction(db, item)
    return {"ok": True}
