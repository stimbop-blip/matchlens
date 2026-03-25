from pydantic import BaseModel, Field


class AdminBroadcastIn(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    message: str = Field(min_length=2, max_length=2000)
    access_level: str = Field(default="free")


class BotNotificationOut(BaseModel):
    id: str
    telegram_id: int
    title: str
    message: str
