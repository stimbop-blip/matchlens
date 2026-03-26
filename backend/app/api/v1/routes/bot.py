from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.enums import AccessLevel
from app.models.tariff import Tariff
from app.schemas.bot import BotPredictionShortOut
from app.schemas.notification import BotNotificationOut
from app.schemas.bot import BotSubscriptionOut, BotTariffOut, BotUserSyncIn, PublicStatsOut
from app.services.prediction_service import list_public_predictions
from app.services.notification_service import (
    mark_notification_failed,
    mark_notification_sent,
    pull_queued_notifications,
    queue_expiring_subscription_notifications,
)
from app.services.stats_service import get_public_stats
from app.services.subscription_service import get_current_subscription_by_telegram_id
from app.services.user_service import upsert_user_by_telegram

router = APIRouter(prefix="/bot", tags=["bot"])


@router.post("/users/sync")
def bot_user_sync(payload: BotUserSyncIn, db: Session = Depends(get_db)) -> dict:
    user = upsert_user_by_telegram(db, payload.model_dump())
    return {"ok": True, "user_id": str(user.id)}


@router.get("/subscriptions/{telegram_id}", response_model=BotSubscriptionOut)
def bot_subscription(telegram_id: int, db: Session = Depends(get_db)) -> BotSubscriptionOut:
    payload = get_current_subscription_by_telegram_id(db, telegram_id)
    return BotSubscriptionOut(**payload)


@router.get("/stats/public", response_model=PublicStatsOut)
def bot_public_stats(db: Session = Depends(get_db)) -> PublicStatsOut:
    payload = get_public_stats(db)
    return PublicStatsOut(**payload)


@router.get("/predictions/free", response_model=list[BotPredictionShortOut])
def bot_latest_free_predictions(limit: int = 3, db: Session = Depends(get_db)) -> list[BotPredictionShortOut]:
    rows = list_public_predictions(
        db,
        limit=limit,
        offset=0,
        sport_type=None,
        access_level=AccessLevel.free.value,
        status=None,
        risk_level=None,
        mode=None,
    )
    return [
        BotPredictionShortOut(
            match_name=item.match_name,
            league=item.league,
            signal_type=item.signal_type,
            odds=float(item.odds),
            event_start_at=item.event_start_at.isoformat(),
            short_description=item.short_description,
        )
        for item in rows
    ]


@router.get("/tariffs", response_model=list[BotTariffOut])
def bot_tariffs(db: Session = Depends(get_db)) -> list[BotTariffOut]:
    records = db.scalars(select(Tariff).where(Tariff.is_active.is_(True)).order_by(Tariff.price_rub.asc())).all()
    return [
        BotTariffOut(
            code=item.code,
            name=item.name,
            price_rub=item.price_rub,
            duration_days=item.duration_days,
            description=item.description,
        )
        for item in records
    ]


@router.get("/notifications/pull", response_model=list[BotNotificationOut])
def bot_pull_notifications(limit: int = 20, db: Session = Depends(get_db)) -> list[BotNotificationOut]:
    rows = pull_queued_notifications(db, limit=limit)
    return [
        BotNotificationOut(
            id=str(item.id),
            telegram_id=user.telegram_id,
            title=item.title,
            message=item.message,
        )
        for item, user in rows
    ]


@router.post("/notifications/{notification_id}/sent")
def bot_mark_notification_sent(notification_id: str, db: Session = Depends(get_db)) -> dict:
    ok = mark_notification_sent(db, notification_id)
    return {"ok": ok}


@router.post("/notifications/{notification_id}/failed")
def bot_mark_notification_failed(notification_id: str, db: Session = Depends(get_db)) -> dict:
    ok = mark_notification_failed(db, notification_id)
    return {"ok": ok}


@router.post("/subscriptions/queue-expiring")
def bot_queue_expiring_subscriptions(hours_before: int = 24, db: Session = Depends(get_db)) -> dict:
    queued = queue_expiring_subscription_notifications(db, hours_before=hours_before)
    return {"ok": True, "queued": queued}
