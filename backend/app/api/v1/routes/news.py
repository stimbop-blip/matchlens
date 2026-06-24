from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models.news_post import NewsPost
from app.models.user import User
from app.schemas.news import NewsOut

router = APIRouter(prefix="/news", tags=["news"])


def _serialize(item: NewsPost) -> NewsOut:
    return NewsOut(
        id=str(item.id),
        title=item.title,
        body=item.body,
        summary=item.summary,
        cover_url=item.cover_url,
        category=item.category,
        is_published=item.is_published,
        published_at=item.published_at,
    )


@router.get("", response_model=list[NewsOut])
def list_news(
    category: str | None = Query(default=None, description="all | pit | bets"),
    limit: int = Query(default=30, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[NewsOut]:
    now = datetime.now(UTC)
    stmt = (
        select(NewsPost)
        .where(NewsPost.is_published.is_(True))
        .where((NewsPost.published_at.is_(None)) | (NewsPost.published_at <= now))
        .order_by(desc(NewsPost.published_at), desc(NewsPost.created_at))
        .limit(limit)
    )

    if category and category.strip().lower() not in {"", "all"}:
        stmt = stmt.where(NewsPost.category == category.strip().lower())

    rows = db.scalars(stmt).all()
    return [_serialize(item) for item in rows]


@router.get("/{news_id}", response_model=NewsOut)
def get_news(
    news_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> NewsOut:
    item = db.get(NewsPost, news_id)
    if not item or not item.is_published:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="News not found")
    return _serialize(item)
