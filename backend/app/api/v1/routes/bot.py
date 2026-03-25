from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.notification import BotNotificationOut
from app.schemas.bot import BotSubscriptionOut, BotUserSyncIn, PublicStatsOut
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
