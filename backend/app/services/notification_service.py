from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from urllib.parse import urlparse

from sqlalchemy import and_, desc, or_, select
from sqlalchemy.orm import Session

from app.models.enums import UserRole
from app.models.news_post import NewsPost
from app.models.notification import Notification
from app.models.prediction import Prediction
from app.models.subscription import Subscription
from app.models.tariff import Tariff
from app.models.user import User
from app.models.user_settings import UserSettings

logger = logging.getLogger(__name__)

_LEVEL_PRIORITY = {"free": 0, "premium": 1, "vip": 2}
_SUPPORTED_LANGUAGES = {"ru", "en"}
_SUPPORTED_THEMES = {"dark", "light"}


def _allowed_levels(access_level: str) -> set[str]:
    if access_level == "vip":
        return {"vip"}
    if access_level == "premium":
        return {"premium", "vip"}
    return {"free", "premium", "vip"}


def _access_label(access_level: str) -> str:
    if access_level == "premium":
        return "Premium"
    if access_level == "vip":
        return "VIP"
    return "Free"


def _mode_label(mode: str) -> str:
    return "Live" if mode == "live" else "Prematch"


def _status_label(status: str) -> str:
    if status == "won":
        return "Выиграл"
    if status == "lost":
        return "Проиграл"
    if status == "refund":
        return "Возврат"
    return "В ожидании"


def _status_summary(status: str) -> str:
    if status == "won":
        return "Сигнал закрылся в плюс."
    if status == "lost":
        return "Сигнал не зашел, фиксируем результат."
    if status == "refund":
        return "Возврат: ставка без изменений банка."
    return "Результат уточняется."


def _format_kickoff(value: datetime) -> str:
    dt = value
    if dt.tzinfo is not None:
        dt = dt.astimezone(UTC)
    return dt.strftime("%d.%m %H:%M UTC")


def _format_odds(value: object) -> str:
    try:
        odds = float(value)
    except (TypeError, ValueError):
        return "-"
    return f"{odds:.2f}"


def _access_pref_enabled(settings: UserSettings | None, access_level: str) -> bool:
    if settings is None:
        return True
    if access_level == "free":
        return bool(settings.notify_free)
    if access_level == "premium":
        return bool(settings.notify_premium)
    if access_level == "vip":
        return bool(settings.notify_vip)
    return True


def _active_level_map(db: Session) -> dict[str, str]:
    level_map: dict[str, str] = {}
    now = datetime.now(UTC)
    rows = db.execute(
        select(Subscription, Tariff)
        .join(Tariff, Tariff.id == Subscription.tariff_id)
        .where(Subscription.status == "active")
        .order_by(desc(Subscription.ends_at))
    ).all()

    for sub, tariff in rows:
        if sub.ends_at and sub.ends_at < now:
            continue

        user_id = str(sub.user_id)
        level = tariff.code
        current = level_map.get(user_id)
        if not current:
            level_map[user_id] = level
            continue

        if _LEVEL_PRIORITY.get(level, 0) >= _LEVEL_PRIORITY.get(current, 0):
            level_map[user_id] = level

    return level_map


def _user_settings_map(db: Session) -> dict[str, UserSettings]:
    rows = db.scalars(select(UserSettings)).all()
    return {str(item.user_id): item for item in rows}


def _normalize_button(button_text: str | None = None, button_url: str | None = None) -> tuple[str | None, str | None]:
    text = (button_text or "").strip() or None
    url = (button_url or "").strip() or None

    if bool(text) != bool(url):
        raise ValueError("Для кнопки укажите и текст, и URL")
    if not text or not url:
        return None, None

    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("URL кнопки должен начинаться с http:// или https://")

    return text, url


def _news_preview(body: str) -> str:
    compact = " ".join(body.split())
    if len(compact) <= 220:
        return compact
    return f"{compact[:217].rstrip()}..."


def _normalize_language(value: str | None) -> str:
    candidate = (value or "").strip().lower()
    if candidate in _SUPPORTED_LANGUAGES:
        return candidate
    return "ru"


def _normalize_theme(value: str | None) -> str:
    candidate = (value or "").strip().lower()
    if candidate in _SUPPORTED_THEMES:
        return candidate
    return "dark"


def _build_prediction_created_payload(prediction: Prediction) -> tuple[str, str]:
    access_level = prediction.access_level.value
    title = f"PIT BET • Новый прогноз • {_access_label(access_level)}"
    lines = [
        f"Матч: {prediction.match_name}",
        f"Лига: {prediction.league or '-'}",
        f"Старт: {_format_kickoff(prediction.event_start_at)}",
        f"Сигнал: {prediction.signal_type}",
        f"Коэффициент: {_format_odds(prediction.odds)}",
        f"Формат: {_mode_label(prediction.mode)}",
        f"Доступ: {_access_label(access_level)}",
    ]

    if prediction.short_description:
        lines.extend(["", f"Кратко: {prediction.short_description}"])

    lines.extend(["", "Откройте PIT BET Mini App через кнопку меню Telegram."])
    return title, "\n".join(lines)


def _build_prediction_result_payload(prediction: Prediction) -> tuple[str, str] | None:
    status = prediction.status.value
    if status not in {"won", "lost", "refund"}:
        return None

    status_label = _status_label(status)
    title = f"PIT BET • Результат прогноза • {status_label}"
    lines = [
        f"Матч: {prediction.match_name}",
        f"Лига: {prediction.league or '-'}",
        f"Итог: {status_label}",
        f"Коэффициент: {_format_odds(prediction.odds)}",
        f"Доступ: {_access_label(prediction.access_level.value)}",
        "",
        _status_summary(status),
        "",
        "Детали доступны в PIT BET Mini App через кнопку меню Telegram.",
    ]
    return title, "\n".join(lines)


def get_or_create_user_settings(db: Session, user: User) -> UserSettings:
    settings = db.scalar(select(UserSettings).where(UserSettings.user_id == user.id))
    if settings:
        return settings

    settings = UserSettings(
        user_id=user.id,
        notify_new_predictions=True,
        notifications_enabled=True,
        notify_free=True,
        notify_premium=True,
        notify_vip=True,
        notify_results=True,
        notify_news=True,
        notify_subscription=True,
        preferred_language=_normalize_language(user.language_code),
        preferred_theme="dark",
    )
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def get_notification_settings(db: Session, user: User) -> dict:
    settings = get_or_create_user_settings(db, user)
    return {
        "notifications_enabled": bool(settings.notifications_enabled),
        "notify_free": bool(settings.notify_free),
        "notify_premium": bool(settings.notify_premium),
        "notify_vip": bool(settings.notify_vip),
        "notify_results": bool(settings.notify_results),
        "notify_news": bool(settings.notify_news),
    }


def get_user_preferences(db: Session, user: User) -> dict:
    settings = get_or_create_user_settings(db, user)
    language = _normalize_language(settings.preferred_language or user.language_code)
    theme = _normalize_theme(settings.preferred_theme)
    return {
        "language": language,
        "theme": theme,
    }


def update_user_preferences(db: Session, user: User, payload: dict) -> dict:
    settings = get_or_create_user_settings(db, user)

    if payload.get("language") is not None:
        language = _normalize_language(str(payload.get("language")))
        settings.preferred_language = language
        user.language_code = language
        db.add(user)

    if payload.get("theme") is not None:
        settings.preferred_theme = _normalize_theme(str(payload.get("theme")))

    db.add(settings)
    db.commit()
    db.refresh(settings)
    db.refresh(user)
    return get_user_preferences(db, user)


def update_notification_settings(db: Session, user: User, payload: dict) -> dict:
    settings = get_or_create_user_settings(db, user)
    for field in ["notifications_enabled", "notify_free", "notify_premium", "notify_vip", "notify_results", "notify_news"]:
        if field in payload and payload[field] is not None:
            setattr(settings, field, bool(payload[field]))
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return get_notification_settings(db, user)


def queue_broadcast(
    db: Session,
    title: str,
    message: str,
    access_level: str = "free",
    button_text: str | None = None,
    button_url: str | None = None,
) -> int:
    cta_text, cta_url = _normalize_button(button_text, button_url)
    users = db.scalars(select(User)).all()
    level_map = _active_level_map(db)
    settings_map = _user_settings_map(db)
    allowed = _allowed_levels(access_level)

    counters = {
        "total": len(users),
        "queued": 0,
        "skip_access": 0,
        "skip_disabled": 0,
        "skip_access_pref": 0,
    }

    for user in users:
        user_level = level_map.get(str(user.id), "free")
        if user_level not in allowed:
            counters["skip_access"] += 1
            continue

        settings = settings_map.get(str(user.id))
        if settings and not settings.notifications_enabled:
            counters["skip_disabled"] += 1
            continue

        if not _access_pref_enabled(settings, access_level):
            counters["skip_access_pref"] += 1
            continue

        db.add(
            Notification(
                user_id=user.id,
                type="manual",
                title=title,
                message=message,
                cta_text=cta_text,
                cta_url=cta_url,
                status="queued",
            )
        )
        counters["queued"] += 1

    db.commit()
    logger.info(
        "notification_broadcast queued=%s total=%s access_level=%s skip_access=%s skip_disabled=%s skip_access_pref=%s",
        counters["queued"],
        counters["total"],
        access_level,
        counters["skip_access"],
        counters["skip_disabled"],
        counters["skip_access_pref"],
    )
    return counters["queued"]


def queue_prediction_notification(db: Session, access_level: str, title: str, message: str) -> int:
    users = db.scalars(select(User)).all()
    level_map = _active_level_map(db)
    settings_map = _user_settings_map(db)
    allowed = _allowed_levels(access_level)

    counters = {
        "total": len(users),
        "queued": 0,
        "skip_access": 0,
        "skip_disabled": 0,
        "skip_new_disabled": 0,
        "skip_access_pref": 0,
    }

    for user in users:
        user_id = str(user.id)
        user_level = level_map.get(user_id, "free")
        if user_level not in allowed:
            counters["skip_access"] += 1
            continue

        settings = settings_map.get(user_id)
        if settings and not settings.notifications_enabled:
            counters["skip_disabled"] += 1
            continue
        if settings and not settings.notify_new_predictions:
            counters["skip_new_disabled"] += 1
            continue
        if not _access_pref_enabled(settings, access_level):
            counters["skip_access_pref"] += 1
            continue

        db.add(Notification(user_id=user.id, type="prediction_created", title=title, message=message, status="queued"))
        counters["queued"] += 1

    db.commit()
    logger.info(
        "notification_prediction_created queued=%s total=%s access_level=%s skip_access=%s skip_disabled=%s skip_new_disabled=%s skip_access_pref=%s",
        counters["queued"],
        counters["total"],
        access_level,
        counters["skip_access"],
        counters["skip_disabled"],
        counters["skip_new_disabled"],
        counters["skip_access_pref"],
    )
    return counters["queued"]


def queue_prediction_created_notification(db: Session, prediction: Prediction) -> int:
    title, message = _build_prediction_created_payload(prediction)
    return queue_prediction_notification(
        db,
        access_level=prediction.access_level.value,
        title=title,
        message=message,
    )


def queue_prediction_result_notification(db: Session, prediction: Prediction) -> int:
    payload = _build_prediction_result_payload(prediction)
    if payload is None:
        logger.info(
            "notification_prediction_result skipped prediction_id=%s reason=unsupported_status status=%s",
            prediction.id,
            prediction.status.value,
        )
        return 0

    if prediction.published_at is None:
        logger.info(
            "notification_prediction_result skipped prediction_id=%s reason=not_published",
            prediction.id,
        )
        return 0

    title, message = payload
    users = db.scalars(select(User)).all()
    level_map = _active_level_map(db)
    settings_map = _user_settings_map(db)
    access_level = prediction.access_level.value
    allowed = _allowed_levels(access_level)

    counters = {
        "total": len(users),
        "queued": 0,
        "skip_access": 0,
        "skip_disabled": 0,
        "skip_results_disabled": 0,
        "skip_access_pref": 0,
    }

    for user in users:
        user_id = str(user.id)
        user_level = level_map.get(user_id, "free")
        if user_level not in allowed:
            counters["skip_access"] += 1
            continue

        settings = settings_map.get(user_id)
        if settings and not settings.notifications_enabled:
            counters["skip_disabled"] += 1
            continue
        if settings and not settings.notify_results:
            counters["skip_results_disabled"] += 1
            continue
        if not _access_pref_enabled(settings, access_level):
            counters["skip_access_pref"] += 1
            continue

        db.add(Notification(user_id=user.id, type="prediction_result", title=title, message=message, status="queued"))
        counters["queued"] += 1

    db.commit()
    logger.info(
        "notification_prediction_result queued=%s total=%s prediction_id=%s access_level=%s status=%s skip_access=%s skip_disabled=%s skip_results_disabled=%s skip_access_pref=%s",
        counters["queued"],
        counters["total"],
        prediction.id,
        access_level,
        prediction.status.value,
        counters["skip_access"],
        counters["skip_disabled"],
        counters["skip_results_disabled"],
        counters["skip_access_pref"],
    )
    return counters["queued"]


def queue_news_published_notification(db: Session, news_post: NewsPost) -> int:
    if not news_post.is_published:
        return 0

    users = db.scalars(select(User)).all()
    settings_map = _user_settings_map(db)
    title = "PIT BET • Новость проекта"
    message = (
        f"{news_post.title}\n\n"
        f"{_news_preview(news_post.body)}\n\n"
        "Откройте PIT BET Mini App, чтобы посмотреть все обновления."
    )

    counters = {
        "total": len(users),
        "queued": 0,
        "skip_disabled": 0,
        "skip_news_disabled": 0,
    }

    for user in users:
        settings = settings_map.get(str(user.id))
        if settings and not settings.notifications_enabled:
            counters["skip_disabled"] += 1
            continue
        if settings and not settings.notify_news:
            counters["skip_news_disabled"] += 1
            continue

        db.add(
            Notification(
                user_id=user.id,
                type="news_published",
                title=title,
                message=message,
                status="queued",
            )
        )
        counters["queued"] += 1

    db.commit()
    logger.info(
        "notification_news_published queued=%s total=%s news_id=%s skip_disabled=%s skip_news_disabled=%s",
        counters["queued"],
        counters["total"],
        news_post.id,
        counters["skip_disabled"],
        counters["skip_news_disabled"],
    )
    return counters["queued"]


def _segment_recipients(
    db: Session,
    segment: str,
    access_level: str | None = None,
    notifications_enabled_only: bool = False,
) -> list[User]:
    users = db.scalars(select(User)).all()
    level_map = _active_level_map(db)
    settings_map = _user_settings_map(db)

    selected: list[User] = []
    for user in users:
        user_level = level_map.get(str(user.id), "free")
        settings = settings_map.get(str(user.id))

        if notifications_enabled_only and settings and not settings.notifications_enabled:
            continue

        if segment == "free" and user_level != "free":
            continue
        if segment == "premium" and user_level != "premium":
            continue
        if segment == "vip" and user_level != "vip":
            continue
        if segment == "active_subscription" and user_level == "free":
            continue
        if segment == "admin" and user.role != UserRole.admin:
            continue
        if segment == "notifications_enabled" and not (settings and settings.notifications_enabled):
            continue

        if access_level:
            if user_level not in _allowed_levels(access_level):
                continue
            if not _access_pref_enabled(settings, access_level):
                continue

        selected.append(user)

    return selected


def preview_campaign_recipients(
    db: Session,
    segment: str,
    access_level: str | None = None,
    notifications_enabled_only: bool = False,
) -> dict:
    recipients = _segment_recipients(
        db,
        segment=segment,
        access_level=access_level,
        notifications_enabled_only=notifications_enabled_only,
    )
    sample = [
        {
            "telegram_id": item.telegram_id,
            "username": item.username,
            "role": item.role.value,
        }
        for item in recipients[:5]
    ]
    return {"count": len(recipients), "sample": sample}


def queue_campaign(
    db: Session,
    title: str,
    message: str,
    segment: str,
    access_level: str | None = None,
    notifications_enabled_only: bool = False,
    button_text: str | None = None,
    button_url: str | None = None,
) -> dict:
    cta_text, cta_url = _normalize_button(button_text, button_url)
    recipients = _segment_recipients(
        db,
        segment=segment,
        access_level=access_level,
        notifications_enabled_only=notifications_enabled_only,
    )
    queued = 0
    for user in recipients:
        db.add(
            Notification(
                user_id=user.id,
                type="admin_campaign",
                title=title,
                message=message,
                cta_text=cta_text,
                cta_url=cta_url,
                status="queued",
            )
        )
        queued += 1
    db.commit()
    logger.info(
        "notification_campaign queued=%s recipients=%s segment=%s access_level=%s notifications_enabled_only=%s",
        queued,
        len(recipients),
        segment,
        access_level,
        notifications_enabled_only,
    )
    return {"queued": queued, "recipients": len(recipients)}


def queue_direct_notification(
    db: Session,
    title: str,
    message: str,
    telegram_id: int | None = None,
    user_id: str | None = None,
    button_text: str | None = None,
    button_url: str | None = None,
) -> dict:
    cta_text, cta_url = _normalize_button(button_text, button_url)
    user: User | None = None
    if user_id:
        user = db.get(User, user_id)
    elif telegram_id:
        user = db.scalar(select(User).where(User.telegram_id == telegram_id))
    if not user:
        logger.info("notification_direct skipped reason=user_not_found telegram_id=%s user_id=%s", telegram_id, user_id)
        return {"queued": 0, "reason": "user_not_found"}

    db.add(
        Notification(
            user_id=user.id,
            type="admin_direct",
            title=title,
            message=message,
            cta_text=cta_text,
            cta_url=cta_url,
            status="queued",
        )
    )
    db.commit()
    logger.info("notification_direct queued=1 user_id=%s telegram_id=%s", user.id, user.telegram_id)
    return {"queued": 1, "user_id": str(user.id), "telegram_id": user.telegram_id}


def notification_delivery_stats(db: Session) -> dict:
    rows = db.execute(
        select(Notification.type, Notification.status)
        .order_by(Notification.created_at.desc())
        .limit(500)
    ).all()
    total = len(rows)
    sent = sum(1 for _, status in rows if status == "sent")
    failed = sum(1 for _, status in rows if status == "failed")
    queued = sum(1 for _, status in rows if status == "queued")
    return {"total": total, "sent": sent, "failed": failed, "queued": queued}


def pull_queued_notifications(db: Session, limit: int = 20) -> list[tuple[Notification, User]]:
    now = datetime.now(UTC)
    rows = db.execute(
        select(Notification, User)
        .join(User, User.id == Notification.user_id)
        .where(Notification.status == "queued")
        .where(or_(Notification.scheduled_at.is_(None), Notification.scheduled_at <= now))
        .order_by(Notification.created_at.asc())
        .limit(limit)
    ).all()
    return list(rows)


def mark_notification_sent(db: Session, notification_id: str) -> bool:
    row = db.get(Notification, notification_id)
    if not row:
        logger.warning("notification_mark_sent missing id=%s", notification_id)
        return False
    row.status = "sent"
    row.sent_at = datetime.now(UTC)
    db.add(row)
    db.commit()
    return True


def mark_notification_failed(db: Session, notification_id: str) -> bool:
    row = db.get(Notification, notification_id)
    if not row:
        logger.warning("notification_mark_failed missing id=%s", notification_id)
        return False
    row.status = "failed"
    db.add(row)
    db.commit()
    return True


def queue_expiring_subscription_notifications(db: Session, hours_before: int = 24) -> int:
    now = datetime.now(UTC)
    horizon = now.replace(microsecond=0) + timedelta(hours=hours_before)

    rows = db.execute(
        select(Subscription, Tariff, User)
        .join(Tariff, Tariff.id == Subscription.tariff_id)
        .join(User, User.id == Subscription.user_id)
        .where(
            and_(
                Subscription.status == "active",
                Subscription.ends_at > now,
                Subscription.ends_at <= horizon,
            )
        )
    ).all()

    created = 0
    skipped_disabled = 0
    skipped_duplicate = 0
    for subscription, tariff, user in rows:
        settings = get_or_create_user_settings(db, user)
        if not settings.notifications_enabled or not settings.notify_subscription:
            skipped_disabled += 1
            continue
        existing = db.scalar(
            select(Notification.id)
            .where(
                Notification.user_id == user.id,
                Notification.type == "subscription_expiring",
                Notification.created_at >= now.replace(hour=0, minute=0, second=0, microsecond=0),
            )
            .limit(1)
        )
        if existing:
            skipped_duplicate += 1
            continue

        db.add(
            Notification(
                user_id=user.id,
                type="subscription_expiring",
                title="PIT BET • Подписка скоро закончится",
                message=(
                    f"Ваш тариф {tariff.name} действует до "
                    f"{subscription.ends_at.strftime('%d.%m.%Y %H:%M')}"
                ),
                status="queued",
            )
        )
        created += 1

    db.commit()
    if rows:
        logger.info(
            "notification_subscription_expiring queued=%s checked=%s skip_disabled=%s skip_duplicate=%s horizon_hours=%s",
            created,
            len(rows),
            skipped_disabled,
            skipped_duplicate,
            hours_before,
        )
    return created
