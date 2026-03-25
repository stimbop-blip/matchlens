from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import PredictionStatus
from app.models.prediction import Prediction


def get_public_stats(db: Session) -> dict:
    total = db.scalar(select(func.count(Prediction.id))) or 0

    won = db.scalar(select(func.count(Prediction.id)).where(Prediction.status == PredictionStatus.won)) or 0
    lost = db.scalar(select(func.count(Prediction.id)).where(Prediction.status == PredictionStatus.lost)) or 0
    settled = won + lost
    winrate = round((won / settled) * 100, 2) if settled else 0.0

    # MVP-заглушка ROI: корректный расчет добавим на шаге prediction_results
    roi = 0.0
    return {"total": int(total), "winrate": winrate, "roi": roi}
