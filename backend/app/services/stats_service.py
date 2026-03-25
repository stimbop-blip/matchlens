from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import AccessLevel
from app.models.enums import PredictionStatus
from app.models.prediction import Prediction


def get_public_stats(db: Session) -> dict:
    total = db.scalar(select(func.count(Prediction.id))) or 0

    won = db.scalar(select(func.count(Prediction.id)).where(Prediction.status == PredictionStatus.won)) or 0
    lost = db.scalar(select(func.count(Prediction.id)).where(Prediction.status == PredictionStatus.lost)) or 0
    refund = db.scalar(select(func.count(Prediction.id)).where(Prediction.status == PredictionStatus.refund)) or 0
    pending = db.scalar(select(func.count(Prediction.id)).where(Prediction.status == PredictionStatus.pending)) or 0

    settled_no_refund = won + lost
    settled_with_refund = won + lost + refund
    winrate = round((won / settled_no_refund) * 100, 2) if settled_no_refund else 0.0

    won_odds_sum = (
        db.scalar(select(func.coalesce(func.sum(Prediction.odds), 0)).where(Prediction.status == PredictionStatus.won)) or 0
    )
    profit_units = float(won_odds_sum) - won - lost
    roi = round((profit_units / settled_with_refund) * 100, 2) if settled_with_refund else 0.0

    by_access = {
        level.value: int(
            db.scalar(select(func.count(Prediction.id)).where(Prediction.access_level == level)) or 0
        )
        for level in AccessLevel
    }

    return {
        "total": int(total),
        "wins": int(won),
        "loses": int(lost),
        "refunds": int(refund),
        "pending": int(pending),
        "hit_rate": winrate,
        "winrate": winrate,
        "roi": roi,
        "by_access": by_access,
    }
