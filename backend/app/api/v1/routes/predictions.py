from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models.enums import AccessLevel
from app.models.user import User
from app.schemas.prediction import PredictionOut
from app.services.access_service import has_access
from app.services.prediction_service import get_prediction_by_id, list_public_predictions
from app.services.subscription_service import get_current_subscription_by_telegram_id

router = APIRouter(prefix="/predictions", tags=["predictions"])


def _prediction_out(item) -> PredictionOut:
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
def list_predictions(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    sport_type: str | None = None,
    access_level: str | None = None,
    status: str | None = None,
    risk_level: str | None = None,
    mode: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PredictionOut]:
    subscription = get_current_subscription_by_telegram_id(db, current_user.telegram_id)
    user_level = subscription.get("tariff", AccessLevel.free.value)
    predictions = list_public_predictions(db, limit, offset, sport_type, access_level, status, risk_level, mode)

    visible: list[PredictionOut] = []
    for item in predictions:
        if not has_access(user_level, item.access_level.value):
            continue
        visible.append(_prediction_out(item))
    return visible


@router.get("/{prediction_id}", response_model=PredictionOut)
def get_prediction(
    prediction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PredictionOut:
    item = get_prediction_by_id(db, prediction_id)
    if not item or item.published_at is None:
        raise HTTPException(status_code=404, detail="Prediction not found")

    subscription = get_current_subscription_by_telegram_id(db, current_user.telegram_id)
    user_level = subscription.get("tariff", AccessLevel.free.value)
    if not has_access(user_level, item.access_level.value):
        raise HTTPException(status_code=403, detail="Upgrade required")

    return _prediction_out(item)
