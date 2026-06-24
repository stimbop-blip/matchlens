from datetime import datetime

from pydantic import BaseModel, Field


class ChatMessageSendIn(BaseModel):
    body: str = Field(min_length=1, max_length=500)


class ChatMessageOut(BaseModel):
    id: str
    author_user_id: str
    author_role: str
    author_name: str
    author_username: str | None
    body: str
    created_at: datetime
    mine: bool = False


class ChatHistoryOut(BaseModel):
    messages: list[ChatMessageOut]
