from aiogram.types import KeyboardButton, ReplyKeyboardMarkup


def main_menu_keyboard(is_admin: bool = False) -> ReplyKeyboardMarkup:
    keyboard = [
        [KeyboardButton(text="⚽ Бесплатные прогнозы"), KeyboardButton(text="📊 Статистика")],
        [KeyboardButton(text="👤 Мой профиль"), KeyboardButton(text="💎 Тарифы")],
        [KeyboardButton(text="🔔 Уведомления"), KeyboardButton(text="🛟 Поддержка")],
    ]
    if is_admin:
        keyboard.append([KeyboardButton(text="🛠 Админка")])

    return ReplyKeyboardMarkup(
        keyboard=keyboard,
        resize_keyboard=True,
        is_persistent=True,
    )
