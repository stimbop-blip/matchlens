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

REFERRAL_FIRST_PURCHASE_DISCOUNT_PERCENT = 10


def _has_paid_tariff_purchase(db: Session, user_id: object) -> bool:
    row = db.scalar(
        select(Payment.id)
        .join(Tariff, Tariff.id == Payment.tariff_id)
        .where(Payment.user_id == user_id)
        .where(Payment.status == PaymentStatus.succeeded)
        .where(Tariff.code.in_(["premium", "vip"]))
        .limit(1)
    )
    return bool(row)


def _referral_first_purchase_discount(db: Session, user: User, tariff: Tariff) -> tuple[int, int, str | None]:
    if tariff.code not in {"premium", "vip"}:
        return 0, int(tariff.price_rub), None
    if not user.referred_by_user_id:
        return 0, int(tariff.price_rub), None
    if _has_paid_tariff_purchase(db, user.id):
        return 0, int(tariff.price_rub), None

    discount_rub = round(int(tariff.price_rub) * (REFERRAL_FIRST_PURCHASE_DISCOUNT_PERCENT / 100))
    final_amount = max(1, int(tariff.price_rub) - discount_rub)
    return discount_rub, final_amount, f"Реферальная скидка {REFERRAL_FIRST_PURCHASE_DISCOUNT_PERCENT}% применена"


def create_payment_for_tariff(db: Session, user: User, tariff_code: str, promo_code: str | None = None) -> tuple[Payment, dict]:
    tariff = db.scalar(select(Tariff).where(Tariff.code == tariff_code, Tariff.is_active.is_(True)))
    if not tariff:
        raise ValueError("Tariff not found")

    if promo_code:
        discount_result = consume_discount_for_payment(db, user, tariff, promo_code)
    else:
        discount_rub, final_price_rub, message = _referral_first_purchase_discount(db, user, tariff)
        discount_result = {
            "promo_code": None,
            "discount_rub": int(discount_rub),
            "final_price_rub": int(final_price_rub),
            "message": message,
        }
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
    if activated_user and tariff.code in {"premium", "vip"}:
        bonus_days = 14 if tariff.code == "vip" else 7
        apply_referral_bonus_on_activation(db, activated_user, bonus_days=bonus_days)

    db.commit()
    db.refresh(subscription)
    return subscription
