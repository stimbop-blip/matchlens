from pydantic import BaseModel, Field, HttpUrl, model_validator


class NotificationButtonMixin(BaseModel):
    button_text: str | None = Field(default=None, min_length=1, max_length=80)
    button_url: HttpUrl | None = None

    @model_validator(mode="after")
    def validate_button_fields(self) -> "NotificationButtonMixin":
        text = self.button_text.strip() if self.button_text else None
        has_text = bool(text)
        has_url = self.button_url is not None
        if has_text != has_url:
            raise ValueError("Для кнопки укажите и текст, и URL")
        self.button_text = text
        return self

    def button_url_str(self) -> str | None:
        return str(self.button_url) if self.button_url else None


class AdminBroadcastIn(NotificationButtonMixin):
    title: str = Field(min_length=2, max_length=255)
    message: str = Field(min_length=2, max_length=2000)
    access_level: str = Field(default="free")


class AdminCampaignPreviewIn(NotificationButtonMixin):
    segment: str = Field(default="all")
    access_level: str | None = Field(default=None)
    notifications_enabled_only: bool = Field(default=False)
    title: str | None = Field(default=None, max_length=255)
    message: str | None = Field(default=None, max_length=2000)


class AdminCampaignSendIn(NotificationButtonMixin):
    title: str = Field(min_length=2, max_length=255)
    message: str = Field(min_length=2, max_length=2000)
    segment: str = Field(default="all")
    access_level: str | None = Field(default=None)
    notifications_enabled_only: bool = Field(default=False)


class AdminDirectSendIn(NotificationButtonMixin):
    title: str = Field(min_length=2, max_length=255)
    message: str = Field(min_length=2, max_length=2000)
    telegram_id: int | None = None
    user_id: str | None = None


class BotNotificationOut(BaseModel):
    id: str
    telegram_id: int
    title: str
    message: str
    button_text: str | None = None
    button_url: str | None = None
