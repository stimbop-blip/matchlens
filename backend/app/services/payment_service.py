from __future__ import annotations

import hashlib
import hmac
from datetime import UTC, datetime, timedelta
from urllib.parse import quote_plus
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import PaymentStatus, SubscriptionStatus
from app.models.payment import Payment
from app.models.subscription import Subscription
from app.models.tariff import Tariff
from app.models.user import User
from app.services.promo_service import consume_discount_for_payment
from app.services.referral_service import apply_referral_bonus_on_activation


def create_payment_for_tariff(db: Session, user: User, tariff_code: str, promo_code: str | None = None) -> tuple[Payment, dict]:
    tariff = db.scalar(select(Tariff).where(Tariff.code == tariff_code, Tariff.is_active.is_(True)))
    if not tariff:
        raise ValueError("Tariff not found")

    discount_result = consume_discount_for_payment(db, user, tariff, promo_code)
    final_amount = int(discount_result["final_price_rub"])

    order_id = f"ml-{uuid4().hex[:16]}"
    target = quote_plus(f"Подписка {tariff.name}")
    payment_url = (
        "https://yoomoney.ru/quickpay/confirm.xml"
        f"?receiver={quote_plus(settings.yoomoney_wallet)}"
        "&quickpay-form=shop"
        f"&targets={target}"
        "&paymentType=AC"
        f"&sum={final_amount}"
        f"&label={order_id}"
        f"&successURL={quote_plus(settings.yoomoney_return_url)}"
    )

    payment = Payment(
        user_id=user.id,
        tariff_id=tariff.id,
        provider="yoomoney",
        provider_order_id=order_id,
        amount_rub=final_amount,
        status=PaymentStatus.pending,
        payment_url=payment_url,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    discount_result["original_amount_rub"] = int(tariff.price_rub)
    return payment, discount_result


def verify_yoomoney_webhook(payload: dict) -> bool:
    required = [
        "notification_type",
        "operation_id",
        "amount",
        "currency",
        "datetime",
        "sender",
        "codepro",
        "label",
        "sha1_hash",
    ]
    if any(k not in payload for k in required):
        return False

    data_string = "&".join(
        [
            payload.get("notification_type", ""),
            payload.get("operation_id", ""),
            payload.get("amount", ""),
            payload.get("currency", ""),
            payload.get("datetime", ""),
            payload.get("sender", ""),
            payload.get("codepro", ""),
            settings.yoomoney_notification_secret,
            payload.get("label", ""),
        ]
    )
    expected_hash = hashlib.sha1(data_string.encode("utf-8")).hexdigest()
    return hmac.compare_digest(expected_hash, payload.get("sha1_hash", ""))


def activate_subscription_for_payment(db: Session, payment: Payment) -> Subscription:
    if payment.status == PaymentStatus.succeeded:
        existing = db.scalar(select(Subscription).where(Subscription.user_id == payment.user_id).order_by(Subscription.ends_at.desc()))
        if existing:
            return existing

    tariff = db.scalar(select(Tariff).where(Tariff.id == payment.tariff_id))
    if not tariff:
        raise ValueError("Tariff not found for payment")

    active_sub = db.scalar(
        select(Subscription)
        .where(Subscription.user_id == payment.user_id, Subscription.status == SubscriptionStatus.active)
        .order_by(Subscription.ends_at.desc())
        .limit(1)
    )

    now = datetime.now(UTC)
    starts_at = now
    if active_sub and active_sub.ends_at > now:
        starts_at = active_sub.ends_at
        active_sub.status = SubscriptionStatus.expired
        db.add(active_sub)

    ends_at = starts_at + timedelta(days=tariff.duration_days)
    subscription = Subscription(
        user_id=payment.user_id,
        tariff_id=tariff.id,
        status=SubscriptionStatus.active,
        starts_at=starts_at,
        ends_at=ends_at,
    )
    db.add(subscription)

    payment.status = PaymentStatus.succeeded
    payment.paid_at = now
    db.add(payment)

    activated_user = db.get(User, payment.user_id)
    if activated_user:
        apply_referral_bonus_on_activation(db, activated_user)

    db.commit()
    db.refresh(subscription)
    return subscription
