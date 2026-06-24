from datetime import datetime

from pydantic import BaseModel, Field


class NewsOut(BaseModel):
    id: str
    title: str
    body: str
    summary: str | None = None
    cover_url: str | None = None
    category: str
    is_published: bool
    published_at: datetime | None


class AdminNewsCreateIn(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    body: str = Field(min_length=3, max_length=20000)
    summary: str | None = Field(default=None, max_length=400)
    cover_url: str | None = Field(default=None, max_length=1024)
    category: str = Field(default="pit", max_length=32)
    is_published: bool = True


class AdminNewsUpdateIn(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=255)
    body: str | None = Field(default=None, min_length=3, max_length=20000)
    summary: str | None = Field(default=None, max_length=400)
    cover_url: str | None = Field(default=None, max_length=1024)
    category: str | None = Field(default=None, max_length=32)
    is_published: bool | None = None
