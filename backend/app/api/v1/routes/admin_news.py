from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.api.deps import require_admin_or_support
from app.core.db import get_db
from app.models.news_post import NewsPost
from app.models.user import User
from app.schemas.news import AdminNewsCreateIn, AdminNewsUpdateIn, NewsOut
from app.services.notification_service import queue_news_published_notification

router = APIRouter(prefix="/admin/news", tags=["admin"])


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
def admin_list_news(db: Session = Depends(get_db), _: User = Depends(require_admin_or_support)) -> list[NewsOut]:
    rows = db.scalars(select(NewsPost).order_by(desc(NewsPost.created_at)).limit(200)).all()
    return [_serialize(item) for item in rows]


@router.post("", response_model=NewsOut)
def admin_create_news(
    payload: AdminNewsCreateIn,
    db: Session = Depends(get_db),
    actor: User = Depends(require_admin_or_support),
) -> NewsOut:
    item = NewsPost(
        title=payload.title.strip(),
        body=payload.body.strip(),
        summary=payload.summary.strip() if payload.summary else None,
        cover_url=(payload.cover_url.strip() if payload.cover_url else None),
        category=payload.category.strip().lower() or "pit",
        is_published=payload.is_published,
        published_at=datetime.now(UTC) if payload.is_published else None,
        created_by=actor.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    if item.is_published:
        queue_news_published_notification(db, item)
    return _serialize(item)


@router.patch("/{news_id}", response_model=NewsOut)
def admin_update_news(
    news_id: str,
    payload: AdminNewsUpdateIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_support),
) -> NewsOut:
    item = db.get(NewsPost, news_id)
    if not item:
        raise HTTPException(status_code=404, detail="News not found")

    was_published = bool(item.is_published)

    data = payload.model_dump(exclude_none=True)
    if "title" in data:
        item.title = str(data["title"]).strip()
    if "body" in data:
        item.body = str(data["body"]).strip()
    if "summary" in data:
        item.summary = str(data["summary"]).strip() or None
    if "cover_url" in data:
        item.cover_url = (str(data["cover_url"]).strip() or None)
    if "category" in data:
        item.category = str(data["category"]).strip().lower() or item.category
    if "is_published" in data:
        is_published = bool(data["is_published"])
        item.is_published = is_published
        if is_published and item.published_at is None:
            item.published_at = datetime.now(UTC)
        if not is_published:
            item.published_at = None

    db.add(item)
    db.commit()
    db.refresh(item)
    if not was_published and item.is_published:
        queue_news_published_notification(db, item)
    return _serialize(item)


@router.delete("/{news_id}")
def admin_delete_news(
    news_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_support),
) -> dict:
    item = db.get(NewsPost, news_id)
    if not item:
        raise HTTPException(status_code=404, detail="News not found")
    db.delete(item)
    db.commit()
    return {"ok": True}
