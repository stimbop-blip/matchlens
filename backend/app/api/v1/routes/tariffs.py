from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.tariff import Tariff
from app.schemas.tariff import TariffOptionOut, TariffOut

router = APIRouter(prefix="/tariffs", tags=["tariffs"])

TARIFF_DESCRIPTION = {
    "free": "Знакомство с PIT BET: бесплатные сигналы, базовая статистика и новости платформы.",
    "premium": "Основной тариф PIT BET: полная Premium-лента, ранний доступ и сильный ежедневный отбор.",
    "vip": "Максимальный пакет: VIP strongest setups, live/hot picks, приоритетные уведомления и расширенные разборы.",
}

TARIFF_PERKS: dict[str, list[str]] = {
    "free": [
        "Бесплатные сигналы для знакомства",
        "Базовая статистика и новости PIT BET",
        "Ограниченный доступ к ленте и базовые Free-уведомления",
        "Доступ к реферальной системе",
    ],
    "premium": [
        "Полная Premium-лента и ранний доступ к сигналам",
        "Уведомления о новых Premium-сигналах и результатах",
        "Краткие разборы, архив и метки 'Выбор дня'",
        "Более сильный ежедневный отбор",
    ],
    "vip": [
        "Все возможности Premium",
        "VIP-сигналы, strongest setups и top picks",
        "Live / hot picks и самый ранний доступ",
        "Расширенные разборы, VIP-блок и приоритетные уведомления",
    ],
}

TARIFF_OPTIONS: dict[str, list[TariffOptionOut]] = {
    "free": [TariffOptionOut(duration_days=0, price_rub=0, badge="Без оплаты", benefit_label="Входной уровень")],
    "premium": [
        TariffOptionOut(duration_days=7, price_rub=490, badge=None, benefit_label="Тестовый старт"),
        TariffOptionOut(duration_days=30, price_rub=1490, badge="Лучший выбор", benefit_label="Оптимальный баланс"),
        TariffOptionOut(duration_days=90, price_rub=3990, badge="Максимальная выгода", benefit_label="До 11% выгоднее"),
    ],
    "vip": [
        TariffOptionOut(duration_days=7, price_rub=1290, badge="Максимум доступа", benefit_label="Интенсивный режим"),
        TariffOptionOut(duration_days=30, price_rub=3990, badge="Лучший выбор", benefit_label="Основной VIP-режим"),
        TariffOptionOut(duration_days=90, price_rub=10490, badge="Максимальная выгода", benefit_label="До 12% выгоднее"),
    ],
}


@router.get("", response_model=list[TariffOut])
def list_tariffs(db: Session = Depends(get_db)) -> list[TariffOut]:
    records = db.scalars(select(Tariff).where(Tariff.is_active.is_(True)).order_by(Tariff.price_rub.asc())).all()
    return [
        TariffOut(
            code=item.code,
            name=item.name,
            price_rub=item.price_rub,
            duration_days=item.duration_days,
            access_level=item.access_level.value,
            description=item.description or TARIFF_DESCRIPTION.get(item.code),
            perks=TARIFF_PERKS.get(item.code, []),
            options=TARIFF_OPTIONS.get(item.code, []),
        )
        for item in records
    ]
