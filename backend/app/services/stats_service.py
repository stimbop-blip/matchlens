from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.enums import AccessLevel
from app.models.enums import PredictionStatus
from app.models.prediction import Prediction


def _empty_detail() -> dict[str, int]:
    return {"total": 0, "wins": 0, "loses": 0, "refunds": 0, "pending": 0}


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

    # Детальная разбивка по тарифам: total / wins / loses / refunds / pending
    by_access_detail: dict[str, dict[str, int]] = {level.value: _empty_detail() for level in AccessLevel}

    grouped = db.execute(
        select(
            Prediction.access_level,
            func.count(Prediction.id).label("total"),
            func.coalesce(func.sum(case((Prediction.status == PredictionStatus.won, 1), else_=0)), 0).label("wins"),
            func.coalesce(func.sum(case((Prediction.status == PredictionStatus.lost, 1), else_=0)), 0).label("loses"),
            func.coalesce(func.sum(case((Prediction.status == PredictionStatus.refund, 1), else_=0)), 0).label("refunds"),
            func.coalesce(func.sum(case((Prediction.status == PredictionStatus.pending, 1), else_=0)), 0).label("pending"),
        ).group_by(Prediction.access_level)
    ).all()

    for row in grouped:
        level_value = row[0].value if hasattr(row[0], "value") else str(row[0])
        if level_value not in by_access_detail:
            continue
        by_access_detail[level_value] = {
            "total": int(row[1] or 0),
            "wins": int(row[2] or 0),
            "loses": int(row[3] or 0),
            "refunds": int(row[4] or 0),
            "pending": int(row[5] or 0),
        }

    # ROI и hit_rate по каждому тарифу (где есть сыгравшие прогнозы)
    for level_value, detail in by_access_detail.items():
        settled_nr = detail["wins"] + detail["loses"]
        settled_wr = detail["wins"] + detail["loses"] + detail["refunds"]
        detail["hit_rate"] = round((detail["wins"] / settled_nr) * 100, 2) if settled_nr else 0.0

        level_enum = AccessLevel(level_value)
        won_odds = db.scalar(
            select(func.coalesce(func.sum(Prediction.odds), 0)).where(
                Prediction.access_level == level_enum,
                Prediction.status == PredictionStatus.won,
            )
        ) or 0
        profit = float(won_odds) - detail["wins"] - detail["loses"]
        detail["roi"] = round((profit / settled_wr) * 100, 2) if settled_wr else 0.0

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
        "by_access_detail": by_access_detail,
    }
