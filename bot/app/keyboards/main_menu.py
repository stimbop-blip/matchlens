from aiogram.types import KeyboardButton, ReplyKeyboardMarkup, WebAppInfo


def main_menu_keyboard(mini_app_url: str) -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="Открыть приложение", web_app=WebAppInfo(url=mini_app_url))],
            [KeyboardButton(text="Бесплатные прогнозы"), KeyboardButton(text="Тарифы")],
            [KeyboardButton(text="Мой профиль"), KeyboardButton(text="Статистика")],
            [KeyboardButton(text="Поддержка")],
        ],
        resize_keyboard=True,
        is_persistent=True,
    )
