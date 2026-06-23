from pydantic import BaseModel


class TelegramInitDataIn(BaseModel):
    init_data: str


class AuthResponse(BaseModel):
    user_id: str
    telegram_id: int
    role: str
    is_admin: bool
