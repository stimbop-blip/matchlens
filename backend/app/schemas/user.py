from pydantic import BaseModel, Field


class MeOut(BaseModel):
    id: str
    telegram_id: int
    username: str | None
    first_name: str | None
    last_name: str | None
    language: str
    theme: str
    role: str
    is_admin: bool
    is_support: bool


class NotificationSettingsOut(BaseModel):
    notifications_enabled: bool
    notify_free: bool
    notify_premium: bool
    notify_vip: bool
    notify_results: bool
    notify_news: bool


class NotificationSettingsUpdateIn(BaseModel):
    notifications_enabled: bool | None = None
    notify_free: bool | None = None
    notify_premium: bool | None = None
    notify_vip: bool | None = None
    notify_results: bool | None = None
    notify_news: bool | None = None


class ReferralOut(BaseModel):
    referral_code: str
    referral_link: str
    invited: int
    activated: int
    bonus_days: int


class UserPreferencesOut(BaseModel):
    language: str
    theme: str


class UserPreferencesUpdateIn(BaseModel):
    language: str | None = Field(default=None, pattern="^(ru|en)$")
    theme: str | None = Field(default=None, pattern="^(dark|light)$")
