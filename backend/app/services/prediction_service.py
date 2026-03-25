from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import Select, desc, select
from sqlalchemy.orm import Session

from app.models.enums import AccessLevel, PredictionStatus
from app.models.prediction import Prediction


def _apply_prediction_filters(
    stmt: Select,
    sport_type: str | None,
    access_level: str | None,
    status: str | None,
    risk_level: str | None,
    mode: str | None,
) -> Select:
    if sport_type:
        stmt = stmt.where(Prediction.sport_type == sport_type)
    if access_level:
        stmt = stmt.where(Prediction.access_level == AccessLevel(access_level))
    if status:
        stmt = stmt.where(Prediction.status == PredictionStatus(status))
    if risk_level:
        stmt = stmt.where(Prediction.risk_level == risk_level)
    if mode:
        stmt = stmt.where(Prediction.mode == mode)
    return stmt


def list_public_predictions(
    db: Session,
    limit: int = 20,
    offset: int = 0,
    sport_type: str | None = None,
    access_level: str | None = None,
    status: str | None = None,
    risk_level: str | None = None,
    mode: str | None = None,
) -> list[Prediction]:
    stmt = select(Prediction).where(Prediction.published_at.is_not(None))
    stmt = _apply_prediction_filters(stmt, sport_type, access_level, status, risk_level, mode)
    stmt = stmt.order_by(desc(Prediction.published_at), desc(Prediction.created_at)).offset(offset).limit(limit)
    return list(db.scalars(stmt).all())


def get_prediction_by_id(db: Session, prediction_id: str) -> Prediction | None:
    return db.get(Prediction, prediction_id)


def create_prediction(db: Session, payload: dict, created_by: str | None) -> Prediction:
    published_at = datetime.now(UTC) if payload.get("publish_now") else None
    prediction = Prediction(
        title=payload["title"],
        match_name=payload["match_name"],
        league=payload.get("league"),
        sport_type=payload["sport_type"],
        event_start_at=payload["event_start_at"],
        signal_type=payload["signal_type"],
        odds=payload["odds"],
        short_description=payload.get("short_description"),
        risk_level=payload.get("risk_level", "medium"),
        access_level=AccessLevel(payload.get("access_level", "free")),
        mode=payload.get("mode", "prematch"),
        published_at=published_at,
        created_by=created_by,
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction


def update_prediction(db: Session, prediction: Prediction, payload: dict) -> Prediction:
    for key, value in payload.items():
        if value is None:
            continue
        if key == "access_level":
            setattr(prediction, key, AccessLevel(value))
            continue
        if key == "status":
            setattr(prediction, key, PredictionStatus(value))
            continue
        if key == "publish_now":
            if value and prediction.published_at is None:
                prediction.published_at = datetime.now(UTC)
            continue
        setattr(prediction, key, value)
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction


def delete_prediction(db: Session, prediction: Prediction) -> None:
    db.delete(prediction)
    db.commit()
