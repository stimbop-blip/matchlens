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


@router.get("", response_model=list[NewsOut])
def list_news(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[NewsOut]:
    now = datetime.now(UTC)
    rows = db.scalars(
        select(NewsPost)
        .where(NewsPost.is_published.is_(True))
        .where((NewsPost.published_at.is_(None)) | (NewsPost.published_at <= now))
        .order_by(desc(NewsPost.published_at), desc(NewsPost.created_at))
        .limit(limit)
    ).all()

    return [
        NewsOut(
            id=str(item.id),
            title=item.title,
            body=item.body,
            category=item.category,
            is_published=item.is_published,
            published_at=item.published_at,
        )
        for item in rows
    ]
