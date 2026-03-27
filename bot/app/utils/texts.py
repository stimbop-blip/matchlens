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
            "<b>PIT BET — главное меню</b>\n\n"
            "Быстрый доступ к прогнозам, статистике, профилю, тарифам и сервисным разделам."
        ),
        "menu_intro": (
            "<b>PIT BET — главное меню</b>\n"
            "Быстрый доступ к прогнозам, статистике, профилю, тарифам и сервисным разделам."
        ),
        "nav_back": "Назад",
        "nav_menu": "В меню",
        "open_mini_app": "📱 Открыть PIT BET",
        "open_news": "📱 Открыть PIT BET",
        "open_feed": "📱 Открыть PIT BET",
        "open_stats": "📈 Открыть статистику",
        "open_profile": "👤 Открыть профиль",
        "open_tariffs": "💎 Открыть тарифы",
        "open_notifications": "⚙ Настроить уведомления",
        "open_settings": "⚙️ Настройки",
        "open_admin": "🛠 Открыть админку",
        "open_referrals": "👤 Открыть профиль",
        "open_referrals_show_link": "📋 Показать ссылку",
        "open_referrals_share": "📤 Поделиться",
        "open_referral_tariffs": "💎 Смотреть тарифы",
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
        "tariffs_subtitle": "Уровни доступа и сроки подписки:",
        "tariffs_days": "дней",
        "tariffs_footer": "Оплата и продление доступны внутри PIT BET.",
        "tariffs_section_free": (
            "<b>Free</b>\n"
            "Для знакомства с PIT BET.\n"
            "• бесплатные сигналы\n"
            "• базовая статистика\n"
            "• новости проекта\n"
            "• ограниченный доступ к ленте"
        ),
        "tariffs_section_premium": (
            "<b>Premium</b>\n"
            "Основной доступ для ежедневного использования.\n"
            "• полная Premium-лента\n"
            "• ранний доступ к сигналам\n"
            "• уведомления о новых публикациях\n"
            "• уведомления о результатах\n"
            "• краткие разборы\n"
            "• архив Premium-сигналов\n"
            "• метки \"Выбор дня\""
        ),
        "tariffs_section_vip": (
            "<b>VIP</b>\n"
            "Максимум доступа и приоритетный уровень.\n"
            "• всё из Premium\n"
            "• VIP-сигналы\n"
            "• strongest setups / top picks\n"
            "• live / hot picks\n"
            "• самый ранний доступ\n"
            "• расширенные разборы\n"
            "• отдельный VIP-блок\n"
            "• приоритетные уведомления"
        ),
        "tariffs_premium_durations": "Сроки Premium:",
        "tariffs_vip_durations": "Сроки VIP:",
        "tariff_7_label": "7 дней — быстрый старт",
        "tariff_30_label": "30 дней — <b>лучший выбор</b>",
        "tariff_90_label": "90 дней — <b>максимальная выгода</b>",
        "tariff_vip_7_label": "7 дней — тест максимального доступа",
        "tariff_vip_30_label": "30 дней — основной VIP-доступ",
        "tariff_vip_90_label": "90 дней — <b>максимум возможностей</b>",
        "tariff_price_unknown": "цена уточняется",
        "settings_title": "⚙️ <b>Настройки PIT BET</b>",
        "settings_body": "Выберите раздел настроек. Расширенные параметры доступны внутри PIT BET.",
        "settings_current_language": "Текущий язык",
        "settings_open_notifications": "🔔 Уведомления",
        "settings_language": "🌐 Язык",
        "settings_language_title": "🌐 <b>Язык интерфейса</b>",
        "settings_language_body": "Выберите язык бота:",
        "settings_language_saved": "Язык обновлен.",
        "settings_language_failed": "Не удалось сохранить язык. Попробуйте позже.",
        "settings_lang_ru": "Русский",
        "settings_lang_en": "English",
        "tariffs_fallback": (
            "<b>💎 Тарифы PIT BET</b>\n"
            "Не удалось загрузить тарифы прямо сейчас."
        ),
        "notifications_text": (
            "<b>🔔 Уведомления PIT BET</b>\n"
            "Настройки уведомлений доступны в приложении: <b>Профиль → Уведомления</b>.\n\n"
            "Можно гибко управлять категориями Free / Premium / VIP, результатами и новостями."
        ),
        "news_title": "⚡️ <b>Новости PIT BET</b>",
        "news_empty": (
            "⚡️ <b>Новости PIT BET</b>\n"
            "Сейчас новых публикаций нет. Проверяйте раздел позже."
        ),
        "news_hint": "Последние публикации:",
        "news_row": "Подробнее • {title}",
        "news_details_title": "<b>📰 Новость PIT BET</b>",
        "news_details_missing": "Не удалось открыть новость. Обновите раздел новостей.",
        "news_date": "Дата",
        "news_no_date": "без даты",
        "referrals_title": "👥 <b>Реферальная программа PIT BET</b>",
        "referrals_body": (
            "Приглашай друзей в PIT BET и получай бонусные дни доступа за их активацию.\n\n"
            "Твои бонусы:\n"
            "• за Premium-покупку реферала — <b>+7 дней Premium</b>\n"
            "• за VIP-покупку реферала — <b>+14 дней Premium</b>\n\n"
            "Что получает друг:\n"
            "• <b>скидку 10%</b> на первую покупку по реферальной ссылке"
        ),
        "referrals_stats": "<b>Ваш код:</b> <code>{code}</code>\n<b>Приглашено:</b> <b>{invited}</b>\n<b>Активировано:</b> <b>{activated}</b>\n<b>Бонусные дни:</b> <b>{bonus_days}</b>",
        "referrals_link_block": "<b>Ваша ссылка:</b>\n<code>{link}</code>",
        "referrals_link_missing": "Ссылка пока недоступна. Попробуйте позже.",
        "referrals_share_text": (
            "PIT BET — сигналы, статистика и доступ к сильным игровым ситуациям.\n"
            "Зайди по моей ссылке и получи скидку 10% на первую покупку:"
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
        "about_title": "ℹ <b>О PIT BET</b>",
        "about_text": (
            "PIT BET — это аналитическая платформа сигналов, а не обычный капперский канал.\n\n"
            "Внутри PIT BET работает система отбора, которая в реальном времени отслеживает:\n"
            "• движение линии\n"
            "• изменения коэффициентов\n"
            "• рыночные сигналы и резкие смещения\n"
            "• форму и контекст матча\n"
            "• игровые паттерны и нестандартные точки входа\n\n"
            "На выходе пользователь получает не хаотичный набор ставок, а уже отобранные игровые ситуации "
            "с понятной структурой, статусами и статистикой.\n\n"
            "Что есть внутри PIT BET:\n"
            "• бесплатные сигналы для знакомства\n"
            "• Premium и VIP-доступ к расширенной ленте\n"
            "• уведомления о новых публикациях и результатах\n"
            "• прозрачная статистика\n"
            "• удобный Mini App прямо внутри Telegram\n\n"
            "PIT BET создан для тех, кто хочет видеть систему, логику отбора и понятную подачу, "
            "а не просто \"чьи-то прогнозы\".\n\n"
            "Информация внутри сервиса носит аналитический характер и не гарантирует результат. "
            "Используйте PIT BET ответственно."
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
        "nav_back": "Back",
        "nav_menu": "Menu",
        "open_mini_app": "📱 Open PIT BET",
        "open_news": "📱 Open PIT BET",
        "open_feed": "📱 Open PIT BET",
        "open_stats": "📈 Open stats",
        "open_profile": "👤 Open profile",
        "open_tariffs": "💎 Open tariffs",
        "open_notifications": "⚙ Configure notifications",
        "open_settings": "⚙️ Settings",
        "open_admin": "🛠 Open admin",
        "open_referrals": "👤 Open profile",
        "open_referrals_show_link": "📋 Show link",
        "open_referrals_share": "📤 Share",
        "open_referral_tariffs": "💎 View tariffs",
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
        "profile_hint": "Detailed profile, payment status, and notification settings are available in the PIT BET app.",
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
        "tariffs_subtitle": "Access levels and subscription durations:",
        "tariffs_days": "days",
        "tariffs_footer": "Payment and renewal are available inside PIT BET.",
        "tariffs_section_free": (
            "<b>Free</b>\n"
            "Entry level to explore PIT BET.\n"
            "• free signals\n"
            "• basic stats\n"
            "• project news\n"
            "• limited feed access"
        ),
        "tariffs_section_premium": (
            "<b>Premium</b>\n"
            "Core access for daily use.\n"
            "• full Premium feed\n"
            "• early access to signals\n"
            "• notifications about new posts\n"
            "• result updates\n"
            "• short breakdowns\n"
            "• Premium archive\n"
            "• \"Pick of the day\" tags"
        ),
        "tariffs_section_vip": (
            "<b>VIP</b>\n"
            "Maximum access and priority level.\n"
            "• everything from Premium\n"
            "• VIP signals\n"
            "• strongest setups / top picks\n"
            "• live / hot picks\n"
            "• earliest access\n"
            "• extended breakdowns\n"
            "• dedicated VIP block\n"
            "• priority notifications"
        ),
        "tariffs_premium_durations": "Premium durations:",
        "tariffs_vip_durations": "VIP durations:",
        "tariff_7_label": "7 days — fast start",
        "tariff_30_label": "30 days — <b>best choice</b>",
        "tariff_90_label": "90 days — <b>maximum value</b>",
        "tariff_vip_7_label": "7 days — maximum access test",
        "tariff_vip_30_label": "30 days — core VIP access",
        "tariff_vip_90_label": "90 days — <b>maximum capabilities</b>",
        "tariff_price_unknown": "price pending",
        "settings_title": "⚙️ <b>PIT BET Settings</b>",
        "settings_body": "Choose a settings section. Extended preferences are available in PIT BET app.",
        "settings_current_language": "Current language",
        "settings_open_notifications": "🔔 Notifications",
        "settings_language": "🌐 Language",
        "settings_language_title": "🌐 <b>Interface language</b>",
        "settings_language_body": "Choose bot language:",
        "settings_language_saved": "Language updated.",
        "settings_language_failed": "Unable to save language. Try again later.",
        "settings_lang_ru": "Russian",
        "settings_lang_en": "English",
        "tariffs_fallback": (
            "<b>💎 PIT BET Tariffs</b>\n"
            "Unable to load tariffs right now."
        ),
        "notifications_text": (
            "<b>🔔 PIT BET Notifications</b>\n"
            "Notification settings are available in the app: <b>Profile → Notifications</b>.\n\n"
            "You can control Free / Premium / VIP categories, outcomes, and news."
        ),
        "news_title": "⚡️ <b>PIT BET News</b>",
        "news_empty": (
            "⚡️ <b>PIT BET News</b>\n"
            "No new publications right now. Check again soon."
        ),
        "news_hint": "Latest posts:",
        "news_row": "Details • {title}",
        "news_details_title": "<b>📰 PIT BET News Post</b>",
        "news_details_missing": "Unable to open the post. Refresh the news section.",
        "news_date": "Date",
        "news_no_date": "no date",
        "referrals_title": "👥 <b>PIT BET Referral Program</b>",
        "referrals_body": (
            "Invite friends to PIT BET and get bonus access days after activation.\n\n"
            "Your bonus:\n"
            "• Premium purchase by referral — <b>+7 Premium days</b>\n"
            "• VIP purchase by referral — <b>+14 Premium days</b>\n\n"
            "Friend benefit:\n"
            "• <b>10% discount</b> on the first purchase via referral link"
        ),
        "referrals_stats": "<b>Your code:</b> <code>{code}</code>\n<b>Invited:</b> <b>{invited}</b>\n<b>Activated:</b> <b>{activated}</b>\n<b>Bonus days:</b> <b>{bonus_days}</b>",
        "referrals_link_block": "<b>Your link:</b>\n<code>{link}</code>",
        "referrals_link_missing": "Link is unavailable right now. Try again later.",
        "referrals_share_text": (
            "PIT BET — signals, stats, and access to strong game situations.\n"
            "Join through my link and get a 10% discount on your first purchase:"
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
        "news": "⚡️ Новости PIT BET",
        "free": "⚽ Бесплатные прогнозы",
        "stats": "📊 Статистика",
        "profile": "👨‍💻 Профиль",
        "tariffs": "💎 Тарифы",
        "referrals": "💥 Рефералы",
        "notifications": "🔔 Уведомления",
        "settings": "⚙️ Настройки",
        "support": "🆘 Поддержка",
        "admin": "🛠 Админка",
        "about": "ℹ Кто мы и как это работает ?",
    },
    "en": {
        "news": "⚡️ PIT BET News",
        "free": "⚽ Free Signals",
        "stats": "📊 PIT BET Stats",
        "profile": "👨‍💻 Profile",
        "tariffs": "💎 PIT BET Tariffs",
        "referrals": "💥 Referrals",
        "notifications": "🔔 Notifications",
        "settings": "⚙️ Settings",
        "support": "🆘 Support",
        "admin": "🛠 Admin",
        "about": "ℹ Who we are and how it works?",
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
