from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.db import get_db
from app.models.user import User
from app.schemas.notification import AdminBroadcastIn
from app.services.notification_service import queue_broadcast

router = APIRouter(prefix="/admin/notifications", tags=["admin"])


@router.post("/broadcast")
def admin_broadcast(
    payload: AdminBroadcastIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    created = queue_broadcast(db, title=payload.title, message=payload.message, access_level=payload.access_level)
    return {"ok": True, "queued": created}
