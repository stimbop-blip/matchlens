from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models.user import User
from app.services.stats_service import get_public_stats

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/overview")
def overview(_: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return get_public_stats(db)
