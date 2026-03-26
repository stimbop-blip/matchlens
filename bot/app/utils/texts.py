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
        "welcome": (
            "🔥 <b>Добро пожаловать в PIT BET</b>\n\n"
            "PIT BET — это платформа сигналов, статистики и доступа к сильным игровым ситуациям.\n\n"
            "Внутри тебя ждут:\n"
            "• бесплатные прогнозы для знакомства\n"
            "• Premium и VIP-доступ к сильным сигналам\n"
            "• прозрачная статистика по результатам\n"
            "• уведомления о новых прогнозах и итогах\n"
            "• удобное приложение прямо внутри Telegram\n\n"
            "PIT BET отслеживает движение линии, коэффициенты, рыночные сигналы и игровые паттерны, "
            "чтобы быстро находить самые интересные точки входа."
        ),
        "onboarding": (
            "<b>Быстрый старт PIT BET</b>\n"
            "Откройте Mini App через кнопку меню Telegram: там доступны лента, тарифы, профиль, новости и настройки уведомлений."
        ),
        "free_empty": (
            "<b>⚽ Бесплатные прогнозы</b>\n"
            "Сейчас в открытой ленте нет новых сигналов.\n\n"
            "Проверьте позже или откройте PIT BET Mini App через кнопку меню Telegram."
        ),
        "tariffs_fallback": (
            "<b>💎 Тарифы PIT BET</b>\n\n"
            "<b>Free</b> — знакомство с продуктом, часть бесплатных сигналов и базовая витрина\n"
            "<b>Premium</b> — основной тариф: полная Premium-лента, уведомления, разборы и сильные сигналы\n"
            "<b>VIP</b> — максимум: VIP-сигналы, ранний доступ, лайв-отбор и расширенные разборы\n\n"
            "Управление тарифом доступно в PIT BET Mini App."
        ),
        "stats_placeholder": (
            "<b>📊 Статистика PIT BET</b>\n"
            "Не удалось загрузить показатели прямо сейчас.\n\n"
            "Повторите запрос позже или проверьте раздел статистики в Mini App."
        ),
        "support_placeholder": (
            "<b>🛟 Поддержка PIT BET</b>\n"
            "Контакт поддержки пока не настроен.\n\n"
            "Ответьте на это сообщение с вопросом — команда PIT BET подхватит обращение вручную."
        ),
        "notifications_text": (
            "<b>🔔 Уведомления PIT BET</b>\n"
            "Настройки находятся в Mini App: <b>Профиль → Уведомления</b>.\n\n"
            "Там можно включить и отключить:\n"
            "• новые сигналы\n"
            "• Free / Premium / VIP категории\n"
            "• результаты (выигрыш, проигрыш, возврат)\n"
            "• новости PIT BET"
        ),
        "admin_text": (
            "<b>🛠 Админка PIT BET</b>\n"
            "Управление прогнозами, платежами, подписками и рассылками PIT BET доступно в Mini App.\n\n"
            "Откройте вкладку <b>Админка</b> через кнопку меню Telegram."
        ),
        "profile_unavailable": "Профиль временно недоступен.",
        "admin_only": "Эта секция доступна только администраторам.",
        "support_title": "<b>🛟 Поддержка PIT BET</b>",
        "support_body": "Если нужна помощь по доступу, оплате или уведомлениям — напишите нам.\n\nМы отвечаем максимально быстро в рабочее время.",
        "support_button": "Написать в поддержку",
        "free_header": "<b>⚽ Бесплатные прогнозы PIT BET</b>\nКраткий дайджест открытой ленты PIT BET.",
        "unknown_match": "Матч уточняется",
        "no_league": "Без лиги",
        "unknown_username": "не указан",
        "label_league": "Лига",
        "label_signal": "Сигнал",
        "label_odds": "Коэффициент",
        "label_start": "Старт",
        "stats_title": "<b>📊 Статистика PIT BET</b>",
        "stats_total": "Прогнозов",
        "stats_hit": "Точность",
        "stats_roi": "ROI",
        "stats_wins": "Выигрыши",
        "stats_loses": "Поражения",
        "stats_refunds": "Возвраты",
        "stats_pending": "В ожидании",
        "profile_title": "<b>👤 Профиль PIT BET</b>",
        "profile_label_username": "Ник",
        "profile_label_tariff": "Тариф",
        "profile_label_status": "Статус",
        "profile_label_ends": "Доступ до",
        "profile_hint": "Управление доступом и настройками PIT BET доступно в Mini App через кнопку меню Telegram.",
        "status_active": "Активна",
        "status_expired": "Истекла",
        "status_canceled": "Отменена",
        "status_inactive": "Не активна",
        "tariffs_title": "<b>💎 Тарифы PIT BET</b>",
        "tariffs_subtitle": "Выберите уровень доступа под вашу нагрузку и стиль работы:",
        "tariffs_days": "дней",
        "tariffs_footer": "Подключение и управление тарифом доступны в PIT BET Mini App.",
    },
    "en": {
        "welcome": (
            "🔥 <b>Welcome to PIT BET</b>\n\n"
            "PIT BET is a platform of signals, statistics, and access to strong market situations.\n\n"
            "Inside you get:\n"
            "• free signals to get started\n"
            "• Premium and VIP access to stronger picks\n"
            "• transparent performance statistics\n"
            "• notifications on new signals and outcomes\n"
            "• a convenient app directly inside Telegram\n\n"
            "PIT BET tracks line movement, odds, market signals, and game patterns to quickly find the most interesting entry points."
        ),
        "onboarding": (
            "<b>PIT BET quick start</b>\n"
            "Open the Mini App from the Telegram menu button: feed, tariffs, profile, news, and notification settings are there."
        ),
        "free_empty": (
            "<b>⚽ Free Signals</b>\n"
            "No new open-feed signals right now.\n\n"
            "Check back later or open PIT BET Mini App from the Telegram menu button."
        ),
        "tariffs_fallback": (
            "<b>💎 PIT BET Tariffs</b>\n\n"
            "<b>Free</b> — product onboarding, part of free signals, and basic showcase\n"
            "<b>Premium</b> — core tier: full Premium feed, notifications, analysis, and strong signals\n"
            "<b>VIP</b> — maximum: VIP signals, early access, live selection, and deeper analysis\n\n"
            "Tariff management is available in PIT BET Mini App."
        ),
        "stats_placeholder": (
            "<b>📊 PIT BET Stats</b>\n"
            "Unable to load metrics right now.\n\n"
            "Try again later or open the statistics section in Mini App."
        ),
        "support_placeholder": (
            "<b>🛟 PIT BET Support</b>\n"
            "Support contact is not configured yet.\n\n"
            "Reply to this message and PIT BET team will handle it manually."
        ),
        "notifications_text": (
            "<b>🔔 PIT BET Notifications</b>\n"
            "Settings are available in Mini App: <b>Profile → Notifications</b>.\n\n"
            "You can enable or disable:\n"
            "• new signals\n"
            "• Free / Premium / VIP categories\n"
            "• results (won, lost, refund)\n"
            "• PIT BET news"
        ),
        "admin_text": (
            "<b>🛠 PIT BET Admin</b>\n"
            "Prediction, payment, subscription, and campaign management is available in Mini App.\n\n"
            "Open the <b>Admin</b> tab from Telegram menu."
        ),
        "profile_unavailable": "Profile is temporarily unavailable.",
        "admin_only": "This section is available to admins only.",
        "support_title": "<b>🛟 PIT BET Support</b>",
        "support_body": "If you need help with access, payments, or notifications, contact us.\n\nWe respond as quickly as possible during business hours.",
        "support_button": "Contact support",
        "free_header": "<b>⚽ PIT BET Free Signals</b>\nQuick digest of the open PIT BET feed.",
        "unknown_match": "Match to be updated",
        "no_league": "No league",
        "unknown_username": "not set",
        "label_league": "League",
        "label_signal": "Signal",
        "label_odds": "Odds",
        "label_start": "Start",
        "stats_title": "<b>📊 PIT BET Stats</b>",
        "stats_total": "Predictions",
        "stats_hit": "Hit rate",
        "stats_roi": "ROI",
        "stats_wins": "Wins",
        "stats_loses": "Losses",
        "stats_refunds": "Refunds",
        "stats_pending": "Pending",
        "profile_title": "<b>👤 PIT BET Profile</b>",
        "profile_label_username": "Username",
        "profile_label_tariff": "Tariff",
        "profile_label_status": "Status",
        "profile_label_ends": "Valid until",
        "profile_hint": "Access and settings are managed in PIT BET Mini App from Telegram menu button.",
        "status_active": "Active",
        "status_expired": "Expired",
        "status_canceled": "Canceled",
        "status_inactive": "Inactive",
        "tariffs_title": "<b>💎 PIT BET Tariffs</b>",
        "tariffs_subtitle": "Choose an access tier for your workload and style:",
        "tariffs_days": "days",
        "tariffs_footer": "Activation and tariff management are available in PIT BET Mini App.",
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
                "tag": "🟢 Entry level",
                "points": [
                    "product onboarding",
                    "part of free signals",
                    "basic stats visibility",
                ],
                "upgrade": "A good way to understand PIT BET approach and signal style.",
            },
            "premium": {
                "label": "Premium",
                "tag": "🔥 Main choice",
                "points": [
                    "full Premium feed",
                    "fast notifications",
                    "analysis and market commentary",
                ],
                "upgrade": "Best balance of depth and speed for daily work.",
            },
            "vip": {
                "label": "VIP",
                "tag": "👑 Maximum package",
                "points": [
                    "VIP high-select signals",
                    "early and live access",
                    "extended analytics and priority",
                ],
                "upgrade": "For users who want maximum access and speed.",
            },
        }

    return {
        "free": {
            "label": "Free",
            "tag": "🟢 Входной уровень",
            "points": [
                "знакомство с продуктом",
                "часть бесплатных сигналов",
                "базовый доступ к статистике",
            ],
            "upgrade": "Подходит, чтобы понять подход PIT BET и стиль сигналов.",
        },
        "premium": {
            "label": "Premium",
            "tag": "🔥 Основной выбор",
            "points": [
                "полная Premium-лента",
                "оперативные уведомления",
                "разборы и рабочие комментарии",
            ],
            "upgrade": "Лучший баланс цены и глубины для регулярной работы.",
        },
        "vip": {
            "label": "VIP",
            "tag": "👑 Максимальный пакет",
            "points": [
                "VIP-сигналы сильнейшего отбора",
                "ранний доступ и лайв-сигналы",
                "расширенные разборы и приоритет",
            ],
            "upgrade": "Для тех, кому нужен максимум доступа и скорости.",
        },
    }
