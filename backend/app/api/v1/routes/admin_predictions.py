from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.db import get_db
from app.models.prediction import Prediction
from app.models.user import User
from app.schemas.prediction import PredictionCreateIn, PredictionOut, PredictionUpdateIn
from app.services.notification_service import queue_prediction_notification, queue_prediction_result_notification
from app.services.prediction_service import create_prediction, delete_prediction, update_prediction

router = APIRouter(prefix="/admin/predictions", tags=["admin"])


@router.get("", response_model=list[PredictionOut])
def admin_list_predictions(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[PredictionOut]:
    rows = db.scalars(select(Prediction).order_by(desc(Prediction.created_at)).limit(200)).all()
    return [
        PredictionOut(
            id=str(item.id),
            title=item.title,
            match_name=item.match_name,
            league=item.league,
            sport_type=item.sport_type,
            event_start_at=item.event_start_at,
            signal_type=item.signal_type,
            odds=float(item.odds),
            short_description=item.short_description,
            risk_level=item.risk_level,
            access_level=item.access_level.value,
            status=item.status.value,
            mode=item.mode,
            published_at=item.published_at,
        )
        for item in rows
    ]


@router.post("", response_model=PredictionOut)
def admin_create_prediction(
    payload: PredictionCreateIn,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> PredictionOut:
    item = create_prediction(db, payload.model_dump(), str(current_admin.id))
    if item.published_at is not None:
        league_text = item.league or "Без лиги"
        queue_prediction_notification(
            db,
            access_level=item.access_level.value,
            title=f"Новый прогноз: {item.title}",
            message=(
                f"Матч: {item.match_name}\n"
                f"Лига: {league_text}\n"
                f"Сигнал: {item.signal_type}\n"
                f"Коэффициент: {float(item.odds)}\n"
                f"Доступ: {item.access_level.value.upper()}\n\n"
                "Откройте Mini App через кнопку меню Telegram"
            ),
        )
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
        risk_level=item.risk_level,
        access_level=item.access_level.value,
        status=item.status.value,
        mode=item.mode,
        published_at=item.published_at,
    )


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
    item = update_prediction(db, item, payload.model_dump())
    if previous_published_at is None and item.published_at is not None:
        league_text = item.league or "Без лиги"
        queue_prediction_notification(
            db,
            access_level=item.access_level.value,
            title=f"Новый прогноз: {item.title}",
            message=(
                f"Матч: {item.match_name}\n"
                f"Лига: {league_text}\n"
                f"Сигнал: {item.signal_type}\n"
                f"Коэффициент: {float(item.odds)}\n"
                f"Доступ: {item.access_level.value.upper()}\n\n"
                "Откройте Mini App через кнопку меню Telegram"
            ),
        )

    result_statuses = {"won", "lost", "refund"}
    if item.status.value in result_statuses and previous_status != item.status.value:
        queue_prediction_result_notification(db, item)
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
        risk_level=item.risk_level,
        access_level=item.access_level.value,
        status=item.status.value,
        mode=item.mode,
        published_at=item.published_at,
    )


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
