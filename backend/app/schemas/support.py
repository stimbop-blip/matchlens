from datetime import datetime

from pydantic import BaseModel, Field


class SupportMessageSendIn(BaseModel):
    body: str = Field(min_length=1, max_length=4000)
    subject: str | None = Field(default=None, max_length=160)


class SupportDialogStatusUpdateIn(BaseModel):
    status: str = Field(pattern="^(open|waiting_user|waiting_support|closed)$")


class SupportMessageOut(BaseModel):
    id: str
    dialog_id: str
    sender_user_id: str
    sender_role: str
    sender_name: str
    body: str
    created_at: datetime


class SupportDialogPreviewOut(BaseModel):
    id: str
    user_id: str
    user_telegram_id: int
    user_username: str | None
    user_first_name: str | None
    status: str
    subject: str | None
    last_message_preview: str | None
    last_message_at: datetime | None
    last_message_by_role: str | None
    last_message_by_name: str | None
    unread_for_staff: int
    unread_for_user: int
    created_at: datetime
    updated_at: datetime


class SupportSubscriptionContextOut(BaseModel):
    tariff: str
    status: str
    ends_at: datetime | None


class SupportPaymentContextOut(BaseModel):
    id: str
    status: str
    amount_rub: int
    access_level: str
    duration_days: int
    method_name: str | None
    review_comment: str | None
    created_at: datetime | None


class SupportDialogContextOut(BaseModel):
    subscription: SupportSubscriptionContextOut
    recent_payments: list[SupportPaymentContextOut]


class SupportDialogDetailOut(BaseModel):
    dialog: SupportDialogPreviewOut | None
    messages: list[SupportMessageOut]
    context: SupportDialogContextOut | None = None


class SupportActionLogOut(BaseModel):
    id: str
    actor_user_id: str | None
    actor_role: str | None
    actor_name: str | None
    action_type: str
    dialog_id: str | None
    target_user_id: str | None
    target_name: str | None
    meta: dict | None
    created_at: datetime
