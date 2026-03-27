from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.enums import AccessLevel
from app.models.news_post import NewsPost
from app.models.tariff import Tariff
from app.models.user import User
from app.schemas.bot import BotPredictionShortOut
from app.schemas.notification import BotNotificationOut
from app.schemas.bot import (
    BotNewsOut,
    BotReferralOut,
    BotSubscriptionOut,
    BotTariffOut,
    BotUserPreferencesOut,
    BotUserPreferencesUpdateIn,
    BotUserSyncIn,
    PublicStatsOut,
)
from app.services.prediction_service import list_public_predictions
from app.services.notification_service import (
    get_user_preferences,
    mark_notification_failed,
    mark_notification_sent,
    pull_queued_notifications,
    queue_expiring_subscription_notifications,
    update_user_preferences,
)
from app.services.referral_service import referral_overview
from app.services.stats_service import get_public_stats
from app.services.subscription_service import get_current_subscription_by_telegram_id
from app.services.user_service import upsert_user_by_telegram

router = APIRouter(prefix="/bot", tags=["bot"])

TARIFF_DESCRIPTION = {
    "free": "Знакомство с PIT BET: часть бесплатных сигналов и базовый доступ.",
    "premium": "Основной тариф: полная Premium-лента, уведомления и разборы.",
    "vip": "Максимум: VIP-сигналы, ранний доступ и лайв-отбор.",
}

TARIFF_OPTIONS = {
    "premium": [
        {"duration_days": 7, "price_rub": 490, "label": "fast_start"},
        {"duration_days": 30, "price_rub": 1490, "label": "best_choice"},
        {"duration_days": 90, "price_rub": 3990, "label": "max_value"},
    ],
    "vip": [
        {"duration_days": 7, "price_rub": 1290, "label": "vip_test"},
        {"duration_days": 30, "price_rub": 3990, "label": "vip_core"},
        {"duration_days": 90, "price_rub": 10490, "label": "vip_max"},
    ],
}


@router.post("/users/sync")
def bot_user_sync(payload: BotUserSyncIn, db: Session = Depends(get_db)) -> dict:
    user = upsert_user_by_telegram(db, payload.model_dump())
    return {"ok": True, "user_id": str(user.id)}


@router.get("/users/{telegram_id}/preferences", response_model=BotUserPreferencesOut)
def bot_user_preferences(telegram_id: int, db: Session = Depends(get_db)) -> BotUserPreferencesOut:
    user = db.scalar(select(User).where(User.telegram_id == telegram_id))
    if not user:
        return BotUserPreferencesOut(language="ru", theme="dark")
    payload = get_user_preferences(db, user)
    return BotUserPreferencesOut(**payload)


@router.patch("/users/{telegram_id}/preferences", response_model=BotUserPreferencesOut)
def bot_user_preferences_update(
    telegram_id: int,
    payload: BotUserPreferencesUpdateIn,
    db: Session = Depends(get_db),
) -> BotUserPreferencesOut:
    user = db.scalar(select(User).where(User.telegram_id == telegram_id))
    if not user:
        return BotUserPreferencesOut(language="ru", theme="dark")
    updated = update_user_preferences(db, user, payload.model_dump(exclude_none=True))
    return BotUserPreferencesOut(**updated)


@router.get("/users/{telegram_id}/referral", response_model=BotReferralOut)
def bot_user_referral(telegram_id: int, db: Session = Depends(get_db)) -> BotReferralOut:
    user = db.scalar(select(User).where(User.telegram_id == telegram_id))
    if not user:
        return BotReferralOut(
            referral_code="-",
            referral_link="",
            invited=0,
            activated=0,
            bonus_days=0,
        )
    payload = referral_overview(db, user)
    return BotReferralOut(**payload)


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


@router.get("/news/latest", response_model=list[BotNewsOut])
def bot_latest_news(limit: int = 3, db: Session = Depends(get_db)) -> list[BotNewsOut]:
    now = datetime.now(UTC)
    rows = db.scalars(
        select(NewsPost)
        .where(NewsPost.is_published.is_(True))
        .where((NewsPost.published_at.is_(None)) | (NewsPost.published_at <= now))
        .order_by(desc(NewsPost.published_at), desc(NewsPost.created_at))
        .limit(limit)
    ).all()

    return [
        BotNewsOut(
            id=str(item.id),
            title=item.title,
            body=item.body,
            category=item.category,
            published_at=item.published_at.isoformat() if item.published_at else None,
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
            description=item.description or TARIFF_DESCRIPTION.get(item.code),
            options=TARIFF_OPTIONS.get(item.code, []),
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
            button_text=item.cta_text,
            button_url=item.cta_url,
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
