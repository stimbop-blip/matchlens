from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import SubscriptionStatus
from app.models.promo_code import PromoCode
from app.models.promo_code_activation import PromoCodeActivation
from app.models.subscription import Subscription
from app.models.tariff import Tariff
from app.models.user import User

DISCOUNT_KINDS = {"percent_discount", "fixed_discount"}
BONUS_KINDS = {"extra_days", "free_access"}
ALL_PROMO_KINDS = DISCOUNT_KINDS | BONUS_KINDS


def normalize_promo_code(value: str) -> str:
    return "".join(ch for ch in value.strip().upper() if ch.isalnum())


def _get_promo_or_none(db: Session, code: str) -> PromoCode | None:
    normalized = normalize_promo_code(code)
    if not normalized:
        return None
    return db.scalar(select(PromoCode).where(PromoCode.code == normalized))


def _already_used(db: Session, promo_id: str, user_id: str) -> bool:
    return bool(
        db.scalar(
            select(PromoCodeActivation.id)
            .where(PromoCodeActivation.promo_code_id == promo_id)
            .where(PromoCodeActivation.user_id == user_id)
            .limit(1)
        )
    )


def _activation_limit_reached(db: Session, promo: PromoCode) -> bool:
    if promo.max_activations is None:
        return False
    count = int(
        db.scalar(select(func.count(PromoCodeActivation.id)).where(PromoCodeActivation.promo_code_id == promo.id)) or 0
    )
    return count >= promo.max_activations


def _validate_common(db: Session, user: User, promo: PromoCode, tariff_code: str | None) -> tuple[bool, str | None]:
    now = datetime.now(UTC)
    if not promo.is_active:
        return False, "Промокод отключен"
    if promo.expires_at and promo.expires_at < now:
        return False, "Срок действия промокода истек"
    if tariff_code and promo.tariff_code and promo.tariff_code != tariff_code:
        return False, "Промокод не подходит для выбранного тарифа"
    if _already_used(db, str(promo.id), str(user.id)):
        return False, "Промокод уже использован"
    if _activation_limit_reached(db, promo):
        return False, "Лимит активаций промокода исчерпан"
    return True, None


def _discount_value(base_price: int, promo: PromoCode) -> tuple[int, int]:
    if promo.kind == "percent_discount":
        percent = max(0, min(90, promo.value))
        discount = round(base_price * (percent / 100))
    elif promo.kind == "fixed_discount":
        discount = max(0, promo.value)
    else:
        discount = 0

    final_price = max(1, base_price - discount)
    return int(discount), int(final_price)


def _create_activation(db: Session, promo: PromoCode, user: User, benefit_type: str, benefit_value: int) -> None:
    db.add(
        PromoCodeActivation(
            promo_code_id=promo.id,
            user_id=user.id,
            benefit_type=benefit_type,
            benefit_value=benefit_value,
        )
    )


def _grant_bonus_access(db: Session, user: User, promo: PromoCode) -> tuple[int, str]:
    now = datetime.now(UTC)
    target_tariff = db.scalar(select(Tariff).where(Tariff.code == (promo.tariff_code or "premium"), Tariff.is_active.is_(True)))
    if not target_tariff:
        target_tariff = db.scalar(select(Tariff).where(Tariff.code == "premium", Tariff.is_active.is_(True)))
    if not target_tariff:
        raise ValueError("Тариф для бонуса недоступен")

    if promo.kind == "free_access":
        days = promo.value if promo.value > 0 else max(7, target_tariff.duration_days)
    else:
        days = promo.value if promo.value > 0 else 7

    active_sub = db.scalar(
        select(Subscription)
        .where(Subscription.user_id == user.id, Subscription.status == SubscriptionStatus.active)
        .order_by(Subscription.ends_at.desc())
        .limit(1)
    )
    if active_sub and active_sub.ends_at > now:
        active_sub.ends_at = active_sub.ends_at + timedelta(days=days)
        db.add(active_sub)
    else:
        db.add(
            Subscription(
                user_id=user.id,
                tariff_id=target_tariff.id,
                status=SubscriptionStatus.active,
                starts_at=now,
                ends_at=now + timedelta(days=days),
            )
        )

    return days, target_tariff.code


def apply_promo_code(db: Session, user: User, code: str, tariff_code: str | None = None) -> dict:
    promo = _get_promo_or_none(db, code)
    if not promo:
        raise ValueError("Промокод не найден")

    is_valid, reason = _validate_common(db, user, promo, tariff_code)
    if not is_valid:
        raise ValueError(reason or "Промокод недоступен")

    if promo.kind in DISCOUNT_KINDS:
        if not tariff_code:
            raise ValueError("Для скидки выберите тариф")
        tariff = db.scalar(select(Tariff).where(Tariff.code == tariff_code, Tariff.is_active.is_(True)))
        if not tariff:
            raise ValueError("Тариф недоступен")

        discount_rub, final_price_rub = _discount_value(tariff.price_rub, promo)
        return {
            "ok": True,
            "mode": "discount_preview",
            "kind": promo.kind,
            "code": promo.code,
            "tariff_code": tariff.code,
            "discount_rub": discount_rub,
            "final_price_rub": final_price_rub,
            "message": f"Промокод активен: скидка {discount_rub} RUB для тарифа {tariff.code.upper()}",
        }

    if promo.kind in BONUS_KINDS:
        days, applied_tariff = _grant_bonus_access(db, user, promo)
        _create_activation(db, promo, user, benefit_type=promo.kind, benefit_value=days)
        db.commit()
        return {
            "ok": True,
            "mode": "bonus_applied",
            "kind": promo.kind,
            "code": promo.code,
            "tariff_code": applied_tariff,
            "bonus_days": days,
            "message": f"Промокод применен: +{days} дней доступа",
        }

    raise ValueError("Неподдерживаемый тип промокода")


def consume_discount_for_payment(db: Session, user: User, tariff: Tariff, code: str | None, base_amount: int | None = None) -> dict:
    base_price = int(base_amount if base_amount is not None else tariff.price_rub)
    if not code:
        return {
            "promo_code": None,
            "discount_rub": 0,
            "final_price_rub": base_price,
            "message": None,
        }

    promo = _get_promo_or_none(db, code)
    if not promo:
        raise ValueError("Промокод не найден")
    if promo.kind not in DISCOUNT_KINDS:
        raise ValueError("Этот промокод нельзя применить к оплате")

    is_valid, reason = _validate_common(db, user, promo, tariff.code)
    if not is_valid:
        raise ValueError(reason or "Промокод недоступен")

    discount_rub, final_price_rub = _discount_value(base_price, promo)
    _create_activation(db, promo, user, benefit_type=promo.kind, benefit_value=discount_rub)

    return {
        "promo_code": promo.code,
        "discount_rub": discount_rub,
        "final_price_rub": final_price_rub,
        "message": f"Промокод {promo.code} применен",
    }
