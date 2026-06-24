from datetime import datetime

from pydantic import BaseModel, Field


class AdOut(BaseModel):
    id: str
    title: str
    body: str
    image_url: str | None = None
    cta_text: str | None = None
    cta_url: str | None = None
    is_active: bool
    sort_order: int
    created_at: datetime


class AdminAdCreateIn(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    body: str = Field(min_length=1, max_length=8000)
    image_url: str | None = Field(default=None, max_length=2048)
    cta_text: str | None = Field(default=None, max_length=120)
    cta_url: str | None = Field(default=None, max_length=2048)
    is_active: bool = True
    sort_order: int = 0


class AdminAdUpdateIn(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    body: str | None = Field(default=None, min_length=1, max_length=8000)
    image_url: str | None = Field(default=None, max_length=2048)
    cta_text: str | None = Field(default=None, max_length=120)
    cta_url: str | None = Field(default=None, max_length=2048)
    is_active: bool | None = None
    sort_order: int | None = None
