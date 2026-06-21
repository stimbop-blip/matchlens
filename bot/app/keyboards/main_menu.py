from __future__ import annotations

from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
    WebAppInfo,
)

from app.config import settings
from app.utils.texts import button, normalize_language, t


def reply_main_menu(language: str = "ru") -> ReplyKeyboardMarkup:
    """Постоянное нижнее меню — 3 главные кнопки + настройки.

    Чисто и понятно: Сигналы / Тарифы / Профиль
    Mini App открывается через inline-кнопку в ответе бота.
    """
    lang = normalize_language(language)
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text=button(lang, "free")),
                KeyboardButton(text=button(lang, "tariffs")),
                KeyboardButton(text=button(lang, "profile")),
            ],
        ],
        resize_keyboard=True,
        is_persistent=True,
    )


def reply_more_menu(language: str = "ru") -> ReplyKeyboardMarkup:
    """Доп. меню (совместимость) — то же что и main."""
    return reply_main_menu(language)


def mini_app_inline_button(language: str = "ru", path: str | None = None) -> InlineKeyboardMarkup:
    """Inline-кнопка для открытия Mini App."""
    lang = normalize_language(language)
    base = settings.mini_app_url.strip().rstrip("/")
    url = f"{base}{path}" if path else settings.mini_app_url
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=t(lang, "open_mini_app"), web_app=WebAppInfo(url=url))]
        ]
    )


def start_inline_keyboard(language: str = "ru", is_admin: bool = False) -> InlineKeyboardMarkup:
    """Inline-кнопки под стартовым сообщением.

    Главная — Mini App (большая), снизу — быстрый доступ к настройкам.
    """
    lang = normalize_language(language)
    rows: list[list[InlineKeyboardButton]] = [
        # Главная CTA (смайлик уже внутри open_mini_app)
        [InlineKeyboardButton(text=t(lang, "open_mini_app"), web_app=WebAppInfo(url=settings.mini_app_url))],
        # Быстрые ссылки (смайлики уже внутри текстов)
        [
            InlineKeyboardButton(text=button(lang, "stats"), callback_data="menu:stats"),
            InlineKeyboardButton(text=t(lang, "settings_language"), callback_data="menu:settings:language"),
            InlineKeyboardButton(text=t(lang, "settings_open_notifications"), callback_data="menu:settings:notifications"),
        ],
    ]
    if is_admin:
        rows.append([InlineKeyboardButton(text=button(lang, "admin"), callback_data="menu:admin")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def main_menu_keyboard(language: str = "ru", is_admin: bool = False) -> InlineKeyboardMarkup:
    """Совместимость со старым вызовом — делегирует в start_inline_keyboard."""
    return start_inline_keyboard(language=language, is_admin=is_admin)


def section_nav_keyboard(
    language: str = "ru",
    *,
    back_callback: str = "menu:main",
    include_open_app: bool = False,
    primary_button: tuple[str, str] | None = None,
    primary_is_web_app: bool = True,
) -> InlineKeyboardMarkup:
    """Навигация внутри раздела: главная кнопка + Назад/В меню."""
    lang = normalize_language(language)
    rows: list[list[InlineKeyboardButton]] = []
    if primary_button:
        if primary_is_web_app:
            rows.append([InlineKeyboardButton(text=primary_button[0], web_app=WebAppInfo(url=primary_button[1]))])
        else:
            rows.append([InlineKeyboardButton(text=primary_button[0], url=primary_button[1])])
    elif include_open_app:
        rows.append([InlineKeyboardButton(text=t(lang, "open_mini_app"), web_app=WebAppInfo(url=settings.mini_app_url))])
    # Кнопки навигации: Назад + В меню
    rows.append([
        InlineKeyboardButton(text="◀️ " + t(lang, "nav_back"), callback_data=back_callback),
        InlineKeyboardButton(text="🏠 " + t(lang, "nav_menu"), callback_data="menu:main"),
    ])
    return InlineKeyboardMarkup(inline_keyboard=rows)
