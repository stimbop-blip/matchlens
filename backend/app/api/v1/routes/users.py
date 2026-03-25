from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import MeOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=MeOut)
def me(current_user: User = Depends(get_current_user)) -> MeOut:
    return MeOut(
        id=str(current_user.id),
        telegram_id=current_user.telegram_id,
        username=current_user.username,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        role=current_user.role.value,
        is_admin=current_user.role.value == "admin",
    )
