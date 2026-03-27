from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import AccessLevel
from app.models.tariff import Tariff
from app.models.payment_method import PaymentMethod


def seed_tariffs(db: Session) -> None:
    exists = db.scalar(select(Tariff.id).limit(1))
    if exists:
        return

    records = [
        Tariff(
            code="free",
            name="Free",
            price_rub=0,
            duration_days=0,
            access_level=AccessLevel.free,
            description="Знакомство с PIT BET: часть бесплатных сигналов и базовый доступ",
        ),
        Tariff(
            code="premium",
            name="Premium",
            price_rub=1490,
            duration_days=30,
            access_level=AccessLevel.premium,
            description="Основной тариф: полная Premium-лента, уведомления и разборы",
        ),
        Tariff(
            code="vip",
            name="VIP",
            price_rub=3990,
            duration_days=30,
            access_level=AccessLevel.vip,
            description="Максимальный пакет: VIP-сигналы, ранний доступ и live/hot picks",
        ),
    ]
    db.add_all(records)
    db.commit()


def seed_payment_methods(db: Session) -> None:
    exists = db.scalar(select(PaymentMethod.id).limit(1))
    if exists:
        return

    records = [
        PaymentMethod(
            code="yoomoney",
            name="Банковская карта (YooMoney)",
            method_type="auto",
            is_active=True,
            sort_order=10,
            instructions="Мгновенная оплата картой через защищенную форму YooMoney.",
        ),
        PaymentMethod(
            code="card_transfer",
            name="Перевод на карту",
            method_type="manual",
            is_active=True,
            sort_order=20,
            card_number="",
            recipient_name="",
            payment_details="",
            instructions="Сделайте перевод, затем нажмите 'Я оплатил' и отправьте комментарий или ID перевода.",
        ),
    ]
    db.add_all(records)
    db.commit()
