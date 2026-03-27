from __future__ import annotations

import hashlib
import hmac
from datetime import UTC, datetime, timedelta
from urllib.parse import quote_plus
from uuid import uuid4

from sqlalchemy import asc, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import AccessLevel, PaymentStatus, SubscriptionStatus
from app.models.payment import Payment
from app.models.payment_method import PaymentMethod
from app.models.subscription import Subscription
from app.models.tariff import Tariff
from app.models.user import User
from app.services.promo_service import consume_discount_for_payment
from app.services.referral_service import apply_referral_bonus_on_activation

REFERRAL_FIRST_PURCHASE_DISCOUNT_PERCENT = 10
ALLOWED_DURATIONS = {7, 30, 90}
PRICING_TABLE: dict[str, dict[int, int]] = {
    "premium": {7: 490, 30: 1490, 90: 3990},
    "vip": {7: 1290, 30: 3990, 90: 10490},
}


def _duration_or_default(duration_days: int | None) -> int:
    candidate = int(duration_days or 30)
    return candidate if candidate in ALLOWED_DURATIONS else 30


def _access_code(access_level: AccessLevel | str) -> str:
    if isinstance(access_level, AccessLevel):
        return access_level.value
    return str(access_level)


def _quote_tariff_price(tariff: Tariff, duration_days: int) -> int:
    access = _access_code(tariff.access_level)
    mapped = PRICING_TABLE.get(access, {}).get(duration_days)
    if mapped is not None:
        return int(mapped)

    if duration_days == 30:
        return int(tariff.price_rub)
    proportional = max(1, round(int(tariff.price_rub) * (duration_days / 30)))
    return int(proportional)


def _has_paid_tariff_purchase(db: Session, user_id: object) -> bool:
    row = db.scalar(
        select(Payment.id)
        .where(Payment.user_id == user_id)
        .where(Payment.status == PaymentStatus.succeeded)
        .where(Payment.access_level_snapshot.in_(["premium", "vip"]))
        .limit(1)
    )
    return bool(row)


def _referral_first_purchase_discount(
    db: Session,
    user: User,
    access_level: str,
    base_amount: int,
) -> tuple[int, int, str | None]:
    if access_level not in {"premium", "vip"}:
        return 0, int(base_amount), None
    if not user.referred_by_user_id:
        return 0, int(base_amount), None
    if _has_paid_tariff_purchase(db, user.id):
        return 0, int(base_amount), None

    discount_rub = round(int(base_amount) * (REFERRAL_FIRST_PURCHASE_DISCOUNT_PERCENT / 100))
    final_amount = max(1, int(base_amount) - discount_rub)
    return discount_rub, final_amount, f"Реферальная скидка {REFERRAL_FIRST_PURCHASE_DISCOUNT_PERCENT}% применена"


def _resolve_active_tariff(db: Session, tariff_code: str) -> Tariff:
    tariff = db.scalar(select(Tariff).where(Tariff.code == tariff_code, Tariff.is_active.is_(True)))
    if not tariff:
        raise ValueError("Tariff not found")
    return tariff


def _resolve_payment_method(db: Session, payment_method_code: str | None) -> PaymentMethod:
    if payment_method_code:
        item = db.scalar(select(PaymentMethod).where(PaymentMethod.code == payment_method_code, PaymentMethod.is_active.is_(True)))
        if not item:
            raise ValueError("Payment method not found")
        return item

    default_method = db.scalar(
        select(PaymentMethod)
        .where(PaymentMethod.is_active.is_(True))
        .order_by(asc(PaymentMethod.sort_order), asc(PaymentMethod.created_at))
        .limit(1)
    )
    if not default_method:
        raise ValueError("No active payment method")
    return default_method


def list_active_payment_methods(db: Session) -> list[PaymentMethod]:
    return db.scalars(
        select(PaymentMethod)
        .where(PaymentMethod.is_active.is_(True))
        .order_by(asc(PaymentMethod.sort_order), asc(PaymentMethod.created_at))
    ).all()


def quote_payment_for_tariff(
    db: Session,
    user: User,
    tariff_code: str,
    duration_days: int,
    promo_code: str | None = None,
) -> dict:
    tariff = _resolve_active_tariff(db, tariff_code)
    duration = _duration_or_default(duration_days)
    original_amount = _quote_tariff_price(tariff, duration)
    access_level = _access_code(tariff.access_level)

    if promo_code:
        promo_result = consume_discount_for_payment(db, user, tariff, promo_code, base_amount=original_amount)
        return {
            "tariff_code": tariff.code,
            "duration_days": duration,
            "access_level": access_level,
            "original_amount_rub": original_amount,
            "final_amount_rub": int(promo_result["final_price_rub"]),
            "discount_rub": int(promo_result["discount_rub"]),
            "applied_discount_source": "promo",
            "promo_code": promo_result.get("promo_code"),
            "message": promo_result.get("message"),
        }

    discount_rub, final_price_rub, message = _referral_first_purchase_discount(db, user, access_level, original_amount)
    return {
        "tariff_code": tariff.code,
        "duration_days": duration,
        "access_level": access_level,
        "original_amount_rub": original_amount,
        "final_amount_rub": int(final_price_rub),
        "discount_rub": int(discount_rub),
        "applied_discount_source": "referral" if discount_rub > 0 else None,
        "promo_code": None,
        "message": message,
    }


def create_payment_for_tariff(
    db: Session,
    user: User,
    tariff_code: str,
    duration_days: int,
    payment_method_code: str | None = None,
    promo_code: str | None = None,
) -> tuple[Payment, dict, PaymentMethod]:
    tariff = _resolve_active_tariff(db, tariff_code)
    method = _resolve_payment_method(db, payment_method_code)
    if method.method_type == "auto" and not settings.payments_enabled:
        raise ValueError("Automatic payments are temporarily disabled")
    quote = quote_payment_for_tariff(db, user, tariff.code, duration_days, promo_code)
    final_amount = int(quote["final_amount_rub"])
    order_id = f"pit-{uuid4().hex[:16]}"

    payment_url: str | None = None
    provider = method.code
    if method.method_type == "auto":
        if method.code == "yoomoney":
            if not settings.yoomoney_wallet:
                raise ValueError("YooMoney is not configured")
            target = quote_plus(f"Подписка {tariff.name} • {quote['duration_days']} дней")
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
            provider = "yoomoney"
        else:
            raise ValueError("Unsupported automatic payment method")

    payment = Payment(
        user_id=user.id,
        tariff_id=tariff.id,
        provider=provider,
        method_code=method.code,
        method_name_snapshot=method.name,
        provider_order_id=order_id,
        amount_rub=final_amount,
        duration_days_snapshot=int(quote["duration_days"]),
        access_level_snapshot=str(quote["access_level"]),
        status=PaymentStatus.pending,
        payment_url=payment_url,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment, quote, method


def confirm_manual_payment(
    db: Session,
    payment: Payment,
    *,
    transfer_reference: str | None,
    note: str | None,
    proof: str | None,
) -> Payment:
    if payment.status not in {PaymentStatus.pending, PaymentStatus.requires_clarification}:
        raise ValueError("Payment cannot be confirmed from current status")

    fragments: list[str] = []
    if transfer_reference and transfer_reference.strip():
        fragments.append(f"Перевод: {transfer_reference.strip()}")
    if note and note.strip():
        fragments.append(note.strip())
    payment.manual_note = "\n".join(fragments) if fragments else payment.manual_note
    payment.manual_proof = proof.strip() if proof and proof.strip() else payment.manual_proof
    payment.status = PaymentStatus.pending_manual_review
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


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

    ends_at = starts_at + timedelta(days=max(1, int(payment.duration_days_snapshot or tariff.duration_days or 30)))
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
    if activated_user and payment.access_level_snapshot in {"premium", "vip"}:
        bonus_days = 14 if payment.access_level_snapshot == "vip" else 7
        apply_referral_bonus_on_activation(db, activated_user, bonus_days=bonus_days)

    db.commit()
    db.refresh(subscription)
    return subscription
