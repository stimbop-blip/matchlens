from pydantic import BaseModel, Field


class AdminBroadcastIn(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    message: str = Field(min_length=2, max_length=2000)
    access_level: str = Field(default="free")


class AdminCampaignPreviewIn(BaseModel):
    segment: str = Field(default="all")
    access_level: str | None = Field(default=None)
    notifications_enabled_only: bool = Field(default=False)


class AdminCampaignSendIn(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    message: str = Field(min_length=2, max_length=2000)
    segment: str = Field(default="all")
    access_level: str | None = Field(default=None)
    notifications_enabled_only: bool = Field(default=False)


class AdminDirectSendIn(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    message: str = Field(min_length=2, max_length=2000)
    telegram_id: int | None = None
    user_id: str | None = None


class BotNotificationOut(BaseModel):
    id: str
    telegram_id: int
    title: str
    message: str
