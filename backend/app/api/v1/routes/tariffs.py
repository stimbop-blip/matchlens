from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.tariff import Tariff
from app.schemas.tariff import TariffOptionOut, TariffOut

router = APIRouter(prefix="/tariffs", tags=["tariffs"])

TARIFF_DESCRIPTION = {
    "free": "Стартовый доступ: бесплатные сигналы, базовая статистика и новости платформы.",
    "premium": "Рабочий тариф PIT BET: полная Premium-лента, ранний доступ и ежедневный отбор с приоритетом по качеству.",
    "vip": "Максимальный режим: strongest setups, live/hot picks, приоритетные оповещения и регулярные VIP-дайджесты.",
}

TARIFF_PERKS: dict[str, list[str]] = {
    "free": [
        "Бесплатные сигналы для знакомства",
        "Базовая статистика и новости PIT BET",
        "Ограниченный доступ к ленте и базовые Free-уведомления",
        "Доступ к реферальной системе",
    ],
    "premium": [
        "Полная Premium-лента + ранний доступ к входам",
        "Сильный ежедневный отбор с фокусом на ликвидные рынки",
        "Сигнальные уведомления + результаты без лишнего шума",
        "Архив разборов, метки 'Выбор дня' и приоритет в приложении",
    ],
    "vip": [
        "Все возможности Premium",
        "VIP strongest setups, top picks и отдельный VIP-поток",
        "Live/hot picks с самым ранним доступом",
        "VIP-дайджесты: регулярные отчеты по эффективности и flat-банку 10 000 RUB",
        "Приоритетная поддержка и приоритетные уведомления",
    ],
}

TARIFF_OPTIONS: dict[str, list[TariffOptionOut]] = {
    "free": [TariffOptionOut(duration_days=0, price_rub=0, badge="Без оплаты", benefit_label="Входной уровень")],
    "premium": [
        TariffOptionOut(duration_days=7, price_rub=490, badge="Пробный вход", benefit_label="Проверка формата"),
        TariffOptionOut(duration_days=30, price_rub=1490, badge="Лучший выбор", benefit_label="Стабильный рабочий режим"),
        TariffOptionOut(duration_days=90, price_rub=3990, badge="Экономия", benefit_label="До 11% выгоднее месяца"),
    ],
    "vip": [
        TariffOptionOut(duration_days=7, price_rub=1290, badge="Тест VIP", benefit_label="Интенсивный режим"),
        TariffOptionOut(duration_days=30, price_rub=3990, badge="Лучший выбор", benefit_label="Основной VIP-цикл"),
        TariffOptionOut(duration_days=90, price_rub=10490, badge="Экономия", benefit_label="До 12% выгоднее месяца"),
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
