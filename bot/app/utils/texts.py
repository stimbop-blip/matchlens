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
            "🔥 <b>Добро пожаловать в PIT BET</b>\n\n"
            "PIT BET — это платформа сигналов, статистики и доступа к сильным игровым ситуациям.\n\n"
            "Здесь ты получаешь:\n"
            "• бесплатные прогнозы для знакомства\n"
            "• Premium и VIP-доступ к сильным сигналам\n"
            "• прозрачную статистику по результатам\n"
            "• уведомления о новых прогнозах и итогах\n"
            "• удобное приложение прямо внутри Telegram\n\n"
            "PIT BET отслеживает движение линии, коэффициенты, рыночные сигналы и игровые паттерны, "
            "чтобы быстро находить самые интересные игровые ситуации.\n\n"
            "Выбери нужный раздел ниже или открой PIT BET через кнопку приложения."
        ),
        "menu_intro": (
            "<b>PIT BET — главное меню</b>\n"
            "Быстрый доступ к прогнозам, статистике, профилю, тарифам и сервисным разделам."
        ),
        "nav_back": "◀ Назад",
        "nav_menu": "☰ В меню",
        "open_mini_app": "📱 Открыть PIT BET",
        "open_feed": "📱 Открыть PIT BET",
        "open_stats": "📈 Открыть статистику",
        "open_profile": "👤 Открыть профиль",
        "open_tariffs": "💎 Открыть тарифы",
        "open_notifications": "⚙ Настроить уведомления",
        "open_admin": "🛠 Открыть админку",
        "free_title": "<b>⚽ Бесплатные прогнозы PIT BET</b>",
        "free_empty": (
            "<b>⚽ Бесплатные прогнозы PIT BET</b>\n"
            "Сейчас в открытой ленте нет новых сигналов."
        ),
        "free_hint": "Выбери матч ниже, чтобы открыть детали.",
        "free_row": "Подробнее • {match}",
        "free_details_title": "<b>📌 Детали прогноза</b>",
        "free_details_missing": "Не удалось открыть детали. Обновите раздел бесплатных прогнозов.",
        "free_details_context": "Контекст сигнала",
        "free_details_reason": "Почему сигнал интересен",
        "free_details_fallback": "Подробный аналитический блок будет добавлен с обновлением сигнала.",
        "label_league": "Лига",
        "label_signal": "Тип сигнала",
        "label_odds": "Коэффициент",
        "label_start": "Время",
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
        "stats_subtitle": "Краткий срез по результатам:",
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
        "profile_hint": "Детальная настройка профиля и уведомлений доступна в приложении PIT BET.",
        "unknown_username": "не указан",
        "status_active": "Активна",
        "status_expired": "Истекла",
        "status_canceled": "Отменена",
        "status_inactive": "Не активна",
        "status_won": "Выигрыш",
        "status_lost": "Поражение",
        "status_refund": "Возврат",
        "status_pending": "В ожидании",
        "tariffs_title": "<b>💎 Тарифы PIT BET</b>",
        "tariffs_subtitle": "Коротко по уровням доступа:",
        "tariffs_days": "дней",
        "tariffs_footer": "Подключение и управление тарифами — внутри PIT BET.",
        "tariffs_fallback": (
            "<b>💎 Тарифы PIT BET</b>\n"
            "Не удалось загрузить тарифы прямо сейчас."
        ),
        "notifications_text": (
            "<b>🔔 Уведомления PIT BET</b>\n"
            "Настройки уведомлений доступны в приложении: <b>Профиль → Уведомления</b>.\n\n"
            "Можно гибко управлять категориями Free / Premium / VIP, результатами и новостями."
        ),
        "support_title": "<b>🛟 Поддержка PIT BET</b>",
        "support_body": "Если нужна помощь по доступу, оплате или уведомлениям — напишите нам.",
        "support_button": "Написать в поддержку",
        "support_placeholder": (
            "<b>🛟 Поддержка PIT BET</b>\n"
            "Контакт поддержки пока не настроен."
        ),
        "admin_text": (
            "<b>🛠 Админка PIT BET</b>\n"
            "Управление прогнозами, подписками, платежами и рассылками доступно в приложении."
        ),
        "admin_only": "Эта секция доступна только администраторам.",
        "about_title": "<b>ℹ О PIT BET</b>",
        "about_text": (
            "PIT BET — это платформа сигналов, статистики и доступа к сильным игровым ситуациям.\n"
            "Сервис помогает быстрее ориентироваться в линии, коэффициентах и рыночных паттернах.\n\n"
            "Мы даем аналитический инструмент, а не обещания гарантированной прибыли."
        ),
    },
    "en": {
        "start_message": (
            "🔥 <b>Welcome to PIT BET</b>\n\n"
            "PIT BET is a platform for signals, statistics, and access to strong game situations.\n\n"
            "Here you get:\n"
            "• free signals to explore the product\n"
            "• Premium and VIP access to stronger setups\n"
            "• transparent performance statistics\n"
            "• notifications about new signals and outcomes\n"
            "• a convenient app directly inside Telegram\n\n"
            "PIT BET tracks line movement, odds, market signals, and game patterns to quickly spot the most interesting situations.\n\n"
            "Choose where to start below, or open PIT BET via the app button."
        ),
        "menu_intro": (
            "<b>PIT BET — Main Menu</b>\n"
            "Quick access to signals, stats, profile, tariffs, and service sections."
        ),
        "nav_back": "◀ Back",
        "nav_menu": "☰ Menu",
        "open_mini_app": "📱 Open PIT BET",
        "open_feed": "📱 Open PIT BET",
        "open_stats": "📈 Open stats",
        "open_profile": "👤 Open profile",
        "open_tariffs": "💎 Open tariffs",
        "open_notifications": "⚙ Configure notifications",
        "open_admin": "🛠 Open admin",
        "free_title": "<b>⚽ PIT BET Free Signals</b>",
        "free_empty": (
            "<b>⚽ PIT BET Free Signals</b>\n"
            "There are no new free-feed signals right now."
        ),
        "free_hint": "Choose a match below to open details.",
        "free_row": "Details • {match}",
        "free_details_title": "<b>📌 Signal details</b>",
        "free_details_missing": "Unable to open details. Refresh the free signals section.",
        "free_details_context": "Signal context",
        "free_details_reason": "Why this signal is interesting",
        "free_details_fallback": "A detailed analytical block will appear when the signal is updated.",
        "label_league": "League",
        "label_signal": "Signal type",
        "label_odds": "Odds",
        "label_start": "Time",
        "label_risk": "Risk",
        "label_status": "Status",
        "label_access": "Access",
        "unknown_match": "Match pending",
        "no_league": "No league",
        "risk_unknown": "not set",
        "stats_placeholder": (
            "<b>📊 PIT BET Stats</b>\n"
            "Stats service is temporarily unavailable."
        ),
        "stats_title": "<b>📊 PIT BET Stats</b>",
        "stats_subtitle": "Quick summary:",
        "stats_total": "Predictions",
        "stats_hit": "Hit rate",
        "stats_roi": "ROI",
        "stats_wins": "Wins",
        "stats_loses": "Loses",
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
        "profile_hint": "Detailed profile and notification settings are available in the PIT BET app.",
        "unknown_username": "not set",
        "status_active": "Active",
        "status_expired": "Expired",
        "status_canceled": "Canceled",
        "status_inactive": "Inactive",
        "status_won": "Won",
        "status_lost": "Lost",
        "status_refund": "Refund",
        "status_pending": "Pending",
        "tariffs_title": "<b>💎 PIT BET Tariffs</b>",
        "tariffs_subtitle": "Quick access-level overview:",
        "tariffs_days": "days",
        "tariffs_footer": "Activation and tariff management are available inside PIT BET.",
        "tariffs_fallback": (
            "<b>💎 PIT BET Tariffs</b>\n"
            "Unable to load tariffs right now."
        ),
        "notifications_text": (
            "<b>🔔 PIT BET Notifications</b>\n"
            "Notification settings are available in the app: <b>Profile → Notifications</b>.\n\n"
            "You can control Free / Premium / VIP categories, outcomes, and news."
        ),
        "support_title": "<b>🛟 PIT BET Support</b>",
        "support_body": "Need help with access, payment, or notifications? Contact us.",
        "support_button": "Contact support",
        "support_placeholder": (
            "<b>🛟 PIT BET Support</b>\n"
            "Support contact is not configured yet."
        ),
        "admin_text": (
            "<b>🛠 PIT BET Admin</b>\n"
            "Predictions, subscriptions, payments, and campaigns are managed in the app."
        ),
        "admin_only": "This section is available to admins only.",
        "about_title": "<b>ℹ About PIT BET</b>",
        "about_text": (
            "PIT BET is a platform for signals, statistics, and access to strong game situations.\n"
            "The service helps users navigate line movement, odds, and market patterns faster.\n\n"
            "We provide analytics, not guaranteed profit promises."
        ),
    },
}


BUTTONS: dict[Language, dict[str, str]] = {
    "ru": {
        "free": "⚽ Бесплатные прогнозы",
        "stats": "📊 Статистика",
        "profile": "👤 Профиль",
        "tariffs": "💎 Тарифы",
        "notifications": "🔔 Уведомления",
        "support": "🛟 Поддержка",
        "admin": "🛠 Админка",
        "about": "ℹ О PIT BET",
    },
    "en": {
        "free": "⚽ Free Signals",
        "stats": "📊 PIT BET Stats",
        "profile": "👤 PIT BET Profile",
        "tariffs": "💎 PIT BET Tariffs",
        "notifications": "🔔 Notifications",
        "support": "🛟 Support",
        "admin": "🛠 Admin",
        "about": "ℹ About PIT BET",
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
                "short": "Free signals to start and explore PIT BET.",
            },
            "premium": {
                "label": "Premium",
                "tag": "Best choice",
                "short": "Main tier for stable daily workflow.",
            },
            "vip": {
                "label": "VIP",
                "tag": "Maximum",
                "short": "Priority access and deeper context.",
            },
        }

    return {
        "free": {
            "label": "Free",
            "tag": "Старт",
            "short": "Бесплатные сигналы для знакомства с PIT BET.",
        },
        "premium": {
            "label": "Premium",
            "tag": "Лучший выбор",
            "short": "Основной тариф для стабильной ежедневной работы.",
        },
        "vip": {
            "label": "VIP",
            "tag": "Максимум",
            "short": "Приоритетный доступ и более глубокий контекст.",
        },
    }
