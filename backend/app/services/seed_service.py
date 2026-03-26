from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import AccessLevel
from app.models.tariff import Tariff


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
