from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.db import get_db
from app.models.enums import SubscriptionStatus
from app.models.subscription import Subscription
from app.models.user import User
from app.services.stats_service import get_public_stats

router = APIRouter(prefix="/admin/stats", tags=["admin"])


@router.get("")
def admin_stats_overview(db: Session = Depends(get_db), _: User = Depends(require_admin)) -> dict:
    users_total = db.scalar(select(func.count(User.id))) or 0
    prediction_stats = get_public_stats(db)

    active_subscriptions = db.scalar(
        select(func.count(Subscription.id)).where(Subscription.status == SubscriptionStatus.active)
    ) or 0

    return {
        "users_total": int(users_total),
        "predictions_total": int(prediction_stats.get("total", 0)),
        "predictions_by_status": {
            "pending": int(prediction_stats.get("pending", 0)),
            "won": int(prediction_stats.get("wins", 0)),
            "lost": int(prediction_stats.get("loses", 0)),
            "refund": int(prediction_stats.get("refunds", 0)),
        },
        "active_subscriptions": int(active_subscriptions),
        "users_by_access": prediction_stats.get("by_access", {"free": 0, "premium": 0, "vip": 0}),
        "hit_rate": prediction_stats.get("hit_rate", 0),
        "roi": prediction_stats.get("roi", 0),
        "events_placeholder": [
            "Лог действий администратора будет доступен в следующем обновлении",
        ],
    }
