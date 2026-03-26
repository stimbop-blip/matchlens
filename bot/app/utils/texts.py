from __future__ import annotations

from typing import Literal

Language = Literal["ru", "en"]


def normalize_language(value: str | None) -> Language:
    candidate = (value or "").strip().lower()
    if candidate.startswith("en"):
        return "en"
    return "ru"


TEXTS: dict[Language, dict[str, str]] = {
    "ru": {
        "start_message": (
            "<b>Добро пожаловать в PIT BET</b>\n\n"
            "PIT BET — аналитическая платформа сигналов и статистики внутри Telegram.\n"
            "Мы работаем с линией, коэффициентами и рыночными паттернами, чтобы выделять сильные игровые ситуации.\n\n"
            "Вам доступны уровни <b>Free / Premium / VIP</b>, Mini App и чистая навигация по разделам.\n"
            "Откройте нужный экран через меню ниже."
        ),
        "menu_intro": (
            "<b>PIT BET — главное меню</b>\n"
            "Быстрый доступ к прогнозам, статистике, профилю, тарифам и сервисным разделам."
        ),
        "nav_back": "◀ Назад",
        "nav_menu": "☰ В меню",
        "open_mini_app": "📱 Открыть PIT BET",
        "open_feed": "⚽ Открыть ленту",
        "open_stats": "📊 Открыть статистику",
        "open_profile": "👤 Открыть профиль",
        "open_tariffs": "💎 Открыть тарифы",
        "open_notifications": "⚙ Настроить",
        "open_admin": "🛠 Открыть админку",
        "free_title": "<b>⚽ Бесплатные прогнозы PIT BET</b>",
        "free_empty": (
            "<b>⚽ Бесплатные прогнозы PIT BET</b>\n"
            "Сейчас в открытой ленте нет новых сигналов."
        ),
        "free_hint": "Нажмите на матч, чтобы открыть детали прогноза.",
        "free_row": "Подробнее • {match}",
        "free_details_title": "<b>📌 Детали прогноза</b>",
        "free_details_missing": "Не удалось открыть детали. Обновите список бесплатных прогнозов.",
        "free_details_context": "Контекст сигнала",
        "free_details_reason": "Почему сигнал интересен",
        "label_league": "Лига",
        "label_signal": "Сигнал",
        "label_odds": "Коэффициент",
        "label_start": "Старт",
        "label_risk": "Риск",
        "label_status": "Статус",
        "label_access": "Доступ",
        "unknown_match": "Матч уточняется",
        "no_league": "Без лиги",
        "risk_unknown": "не указан",
        "stats_placeholder": (
            "<b>📊 Статистика PIT BET</b>\n"
            "Сервис статистики временно недоступен."
        ),
        "stats_title": "<b>📊 Статистика PIT BET</b>",
        "stats_subtitle": "Краткий срез по результатам PIT BET:",
        "stats_total": "Прогнозов",
        "stats_hit": "Точность",
        "stats_roi": "ROI",
        "stats_wins": "Выигрыши",
        "stats_loses": "Поражения",
        "stats_refunds": "Возвраты",
        "stats_pending": "В ожидании",
        "profile_unavailable": "Профиль временно недоступен.",
        "profile_title": "<b>👤 Профиль PIT BET</b>",
        "profile_label_username": "Ник",
        "profile_label_tariff": "Тариф",
        "profile_label_status": "Статус",
        "profile_label_ends": "Доступ до",
        "profile_label_referral": "Реферальный код",
        "profile_label_referral_link": "Реферальная ссылка",
        "profile_label_invited": "Приглашено",
        "profile_label_activated": "Активировано",
        "profile_label_bonus": "Бонусные дни",
        "profile_referral_missing": "не активирован",
        "profile_hint": "Детальная настройка подписки, уведомлений и бонусов доступна в Mini App.",
        "unknown_username": "не указан",
        "status_active": "Активна",
        "status_expired": "Истекла",
        "status_canceled": "Отменена",
        "status_inactive": "Не активна",
        "tariffs_title": "<b>💎 Тарифы PIT BET</b>",
        "tariffs_subtitle": "Выберите уровень доступа под вашу нагрузку:",
        "tariffs_days": "дней",
        "tariffs_footer": "Подключение и управление тарифами доступны в PIT BET Mini App.",
        "tariffs_fallback": (
            "<b>💎 Тарифы PIT BET</b>\n"
            "Не удалось загрузить тарифы прямо сейчас."
        ),
        "notifications_text": (
            "<b>🔔 Уведомления PIT BET</b>\n"
            "Управление уведомлениями находится в Mini App: <b>Профиль → Уведомления</b>.\n\n"
            "Доступны категории Free / Premium / VIP, результаты и новости."
        ),
        "support_title": "<b>🛟 Поддержка PIT BET</b>",
        "support_body": "Если нужна помощь по доступу, оплате или уведомлениям — мы на связи.",
        "support_button": "Написать в поддержку",
        "support_placeholder": (
            "<b>🛟 Поддержка PIT BET</b>\n"
            "Контакт поддержки пока не настроен."
        ),
        "admin_text": (
            "<b>🛠 Админка PIT BET</b>\n"
            "Управление прогнозами, подписками, платежами и рассылками доступно в Mini App."
        ),
        "admin_only": "Эта секция доступна только администраторам.",
        "status_won": "Выигрыш",
        "status_lost": "Поражение",
        "status_refund": "Возврат",
        "status_pending": "В ожидании",
        "disclaimer_bot": "PIT BET предоставляет аналитику и не гарантирует финансовый результат. Используйте сервис ответственно.",
    },
    "en": {
        "start_message": (
            "<b>Welcome to PIT BET</b>\n\n"
            "PIT BET is an analytics platform for signals and statistics inside Telegram.\n"
            "We track line movement, odds, and market patterns to highlight strong game situations.\n\n"
            "You have access to <b>Free / Premium / VIP</b>, the Mini App, and clean section navigation.\n"
            "Open the section you need from the menu below."
        ),
        "menu_intro": (
            "<b>PIT BET — Main Menu</b>\n"
            "Quick access to signals, stats, profile, tariffs, and service sections."
        ),
        "nav_back": "◀ Back",
        "nav_menu": "☰ Menu",
        "open_mini_app": "📱 Open PIT BET",
        "open_feed": "⚽ Open feed",
        "open_stats": "📊 Open stats",
        "open_profile": "👤 Open profile",
        "open_tariffs": "💎 Open tariffs",
        "open_notifications": "⚙ Configure",
        "open_admin": "🛠 Open admin",
        "free_title": "<b>⚽ PIT BET Free Signals</b>",
        "free_empty": (
            "<b>⚽ PIT BET Free Signals</b>\n"
            "No new open-feed signals right now."
        ),
        "free_hint": "Tap a match to open signal details.",
        "free_row": "Details • {match}",
        "free_details_title": "<b>📌 Signal details</b>",
        "free_details_missing": "Unable to open details. Refresh free signals list first.",
        "free_details_context": "Signal context",
        "free_details_reason": "Why this signal is interesting",
        "label_league": "League",
        "label_signal": "Signal",
        "label_odds": "Odds",
        "label_start": "Kickoff",
        "label_risk": "Risk",
        "label_status": "Status",
        "label_access": "Access",
        "unknown_match": "Match to be updated",
        "no_league": "No league",
        "risk_unknown": "not set",
        "stats_placeholder": (
            "<b>📊 PIT BET Stats</b>\n"
            "Stats service is temporarily unavailable."
        ),
        "stats_title": "<b>📊 PIT BET Stats</b>",
        "stats_subtitle": "Quick summary of PIT BET results:",
        "stats_total": "Predictions",
        "stats_hit": "Hit rate",
        "stats_roi": "ROI",
        "stats_wins": "Wins",
        "stats_loses": "Losses",
        "stats_refunds": "Refunds",
        "stats_pending": "Pending",
        "profile_unavailable": "Profile is temporarily unavailable.",
        "profile_title": "<b>👤 PIT BET Profile</b>",
        "profile_label_username": "Username",
        "profile_label_tariff": "Tariff",
        "profile_label_status": "Status",
        "profile_label_ends": "Valid until",
        "profile_label_referral": "Referral code",
        "profile_label_referral_link": "Referral link",
        "profile_label_invited": "Invited",
        "profile_label_activated": "Activated",
        "profile_label_bonus": "Bonus days",
        "profile_referral_missing": "not activated",
        "profile_hint": "Detailed subscription, notification, and bonus settings are in the Mini App.",
        "unknown_username": "not set",
        "status_active": "Active",
        "status_expired": "Expired",
        "status_canceled": "Canceled",
        "status_inactive": "Inactive",
        "tariffs_title": "<b>💎 PIT BET Tariffs</b>",
        "tariffs_subtitle": "Choose access level for your workload:",
        "tariffs_days": "days",
        "tariffs_footer": "Activation and tariff management are available in PIT BET Mini App.",
        "tariffs_fallback": (
            "<b>💎 PIT BET Tariffs</b>\n"
            "Unable to load tariffs right now."
        ),
        "notifications_text": (
            "<b>🔔 PIT BET Notifications</b>\n"
            "Notification settings are available in Mini App: <b>Profile → Notifications</b>.\n\n"
            "You can control Free / Premium / VIP categories, outcomes, and news."
        ),
        "support_title": "<b>🛟 PIT BET Support</b>",
        "support_body": "Need help with access, payments, or notifications? We are here for you.",
        "support_button": "Contact support",
        "support_placeholder": (
            "<b>🛟 PIT BET Support</b>\n"
            "Support contact is not configured yet."
        ),
        "admin_text": (
            "<b>🛠 PIT BET Admin</b>\n"
            "Predictions, subscriptions, payments, and campaigns are managed in Mini App."
        ),
        "admin_only": "This section is available to admins only.",
        "status_won": "Won",
        "status_lost": "Lost",
        "status_refund": "Refund",
        "status_pending": "Pending",
        "disclaimer_bot": "PIT BET provides analytics and does not guarantee financial outcomes. Please use the service responsibly.",
    },
}


BUTTONS: dict[Language, dict[str, str]] = {
    "ru": {
        "free": "⚽ Бесплатные прогнозы",
        "stats": "📊 Статистика PIT BET",
        "profile": "👤 Профиль PIT BET",
        "tariffs": "💎 Тарифы PIT BET",
        "notifications": "🔔 Уведомления",
        "support": "🛟 Поддержка",
        "admin": "🛠 Админка",
    },
    "en": {
        "free": "⚽ Free Signals",
        "stats": "📊 PIT BET Stats",
        "profile": "👤 PIT BET Profile",
        "tariffs": "💎 PIT BET Tariffs",
        "notifications": "🔔 Notifications",
        "support": "🛟 Support",
        "admin": "🛠 Admin",
    },
}


def t(language: str | None, key: str) -> str:
    lang = normalize_language(language)
    return TEXTS[lang].get(key, key)


def button(language: str | None, key: str) -> str:
    lang = normalize_language(language)
    return BUTTONS[lang].get(key, key)


def tariff_presentation(language: str | None) -> dict[str, dict[str, object]]:
    lang = normalize_language(language)
    if lang == "en":
        return {
            "free": {
                "label": "Free",
                "tag": "Entry",
                "points": [
                    "part of free signals",
                    "basic statistics",
                    "quick PIT BET onboarding",
                ],
                "upgrade": "A clean start to understand PIT BET approach.",
            },
            "premium": {
                "label": "Premium",
                "tag": "Best choice",
                "points": [
                    "full Premium feed",
                    "fast notifications",
                    "extended market notes",
                ],
                "upgrade": "Core tier for consistent daily work.",
            },
            "vip": {
                "label": "VIP",
                "tag": "Maximum",
                "points": [
                    "VIP high-select signals",
                    "priority and early access",
                    "deeper analytical context",
                ],
                "upgrade": "For users who need maximum speed and depth.",
            },
        }

    return {
        "free": {
            "label": "Free",
            "tag": "Старт",
            "points": [
                "часть открытых сигналов",
                "базовая статистика",
                "быстрое знакомство с PIT BET",
            ],
            "upgrade": "Подходит, чтобы понять стиль и подход PIT BET.",
        },
        "premium": {
            "label": "Premium",
            "tag": "Лучший выбор",
            "points": [
                "полная Premium-лента",
                "оперативные уведомления",
                "расширенные рыночные комментарии",
            ],
            "upgrade": "Основной тариф для ежедневной работы.",
        },
        "vip": {
            "label": "VIP",
            "tag": "Максимум",
            "points": [
                "VIP-сигналы сильного отбора",
                "приоритетный ранний доступ",
                "более глубокий аналитический контекст",
            ],
            "upgrade": "Для тех, кому нужен максимум скорости и глубины.",
        },
    }
