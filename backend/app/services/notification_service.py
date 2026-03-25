from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.subscription import Subscription
from app.models.tariff import Tariff
from app.models.user import User


def _allowed_levels(access_level: str) -> set[str]:
    if access_level == "vip":
        return {"vip"}
    if access_level == "premium":
        return {"premium", "vip"}
    return {"free", "premium", "vip"}


def queue_broadcast(db: Session, title: str, message: str, access_level: str = "free") -> int:
    users = db.scalars(select(User)).all()
    level_map: dict[str, str] = {}

    active_subs = db.execute(
        select(Subscription, Tariff)
        .join(Tariff, Tariff.id == Subscription.tariff_id)
        .where(Subscription.status == "active")
    ).all()
    now = datetime.now(UTC)
    for sub, tariff in active_subs:
        if sub.ends_at and sub.ends_at < now:
            continue
        level_map[str(sub.user_id)] = tariff.code

    allowed = _allowed_levels(access_level)
    created = 0
    for user in users:
        user_level = level_map.get(str(user.id), "free")
        if user_level not in allowed:
            continue
        db.add(Notification(user_id=user.id, type="manual", title=title, message=message, status="queued"))
        created += 1

    db.commit()
    return created


def queue_prediction_notification(db: Session, access_level: str, title: str, message: str) -> int:
    return queue_broadcast(db, title=title, message=message, access_level=access_level)


def pull_queued_notifications(db: Session, limit: int = 20) -> list[tuple[Notification, User]]:
    rows = db.execute(
        select(Notification, User)
        .join(User, User.id == Notification.user_id)
        .where(Notification.status == "queued")
        .order_by(Notification.created_at.asc())
        .limit(limit)
    ).all()
    return list(rows)


def mark_notification_sent(db: Session, notification_id: str) -> bool:
    row = db.get(Notification, notification_id)
    if not row:
        return False
    row.status = "sent"
    row.sent_at = datetime.now(UTC)
    db.add(row)
    db.commit()
    return True


def mark_notification_failed(db: Session, notification_id: str) -> bool:
    row = db.get(Notification, notification_id)
    if not row:
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
    for subscription, tariff, user in rows:
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
            continue

        db.add(
            Notification(
                user_id=user.id,
                type="subscription_expiring",
                title="Подписка скоро закончится",
                message=(
                    f"Ваш тариф {tariff.name} действует до "
                    f"{subscription.ends_at.strftime('%d.%m.%Y %H:%M')}"
                ),
                status="queued",
            )
        )
        created += 1

    db.commit()
    return created
