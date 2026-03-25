from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.db import get_db
from app.models.enums import AccessLevel, PredictionStatus, SubscriptionStatus
from app.models.prediction import Prediction
from app.models.subscription import Subscription
from app.models.tariff import Tariff
from app.models.user import User

router = APIRouter(prefix="/admin/stats", tags=["admin"])


@router.get("")
def admin_stats_overview(db: Session = Depends(get_db), _: User = Depends(require_admin)) -> dict:
    users_total = db.scalar(select(func.count(User.id))) or 0
    predictions_total = db.scalar(select(func.count(Prediction.id))) or 0

    prediction_by_status = {
        status.value: int(db.scalar(select(func.count(Prediction.id)).where(Prediction.status == status)) or 0)
        for status in PredictionStatus
    }

    active_subscriptions = db.scalar(
        select(func.count(Subscription.id)).where(Subscription.status == SubscriptionStatus.active)
    ) or 0

    tariff_counts: dict[str, int] = {"free": 0, "premium": 0, "vip": 0}
    rows = db.execute(
        select(Tariff.code, func.count(Subscription.id))
        .join(Subscription, Subscription.tariff_id == Tariff.id)
        .where(Subscription.status == SubscriptionStatus.active)
        .group_by(Tariff.code)
    ).all()
    for code, count in rows:
        tariff_counts[str(code)] = int(count)

    free_fallback = int(users_total - tariff_counts.get("premium", 0) - tariff_counts.get("vip", 0))
    if free_fallback > tariff_counts.get("free", 0):
        tariff_counts["free"] = free_fallback

    return {
        "users_total": int(users_total),
        "predictions_total": int(predictions_total),
        "predictions_by_status": prediction_by_status,
        "active_subscriptions": int(active_subscriptions),
        "users_by_access": {
            AccessLevel.free.value: int(tariff_counts.get("free", 0)),
            AccessLevel.premium.value: int(tariff_counts.get("premium", 0)),
            AccessLevel.vip.value: int(tariff_counts.get("vip", 0)),
        },
        "events_placeholder": [
            "Лог действий администратора будет доступен в следующем обновлении",
        ],
    }
