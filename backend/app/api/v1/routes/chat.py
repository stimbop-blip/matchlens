from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin_or_support
from app.core.db import get_db
from app.models.user import User
from app.schemas.chat import (
    ChatBlockResultOut,
    ChatDeleteResultOut,
    ChatHistoryOut,
    ChatMessageOut,
    ChatMessageSendIn,
)
from app.services.chat_service import (
    ChatBlockedError,
    ChatNotFoundError,
    delete_message,
    list_recent_messages,
    send_message,
    set_user_blocked,
)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/messages", response_model=ChatHistoryOut)
def chat_history(
    limit: int = Query(default=200, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatHistoryOut:
    rows = list_recent_messages(db, viewer=current_user, limit=limit)
    return ChatHistoryOut(messages=[ChatMessageOut(**item) for item in rows])


@router.post("/messages", response_model=ChatMessageOut)
def chat_send(
    payload: ChatMessageSendIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatMessageOut:
    try:
        item = send_message(db, author=current_user, body=payload.body)
    except ChatBlockedError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ChatMessageOut(**item)


@router.delete("/messages/{message_id}", response_model=ChatDeleteResultOut)
def chat_delete_message(
    message_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatDeleteResultOut:
    try:
        result = delete_message(db, message_id=message_id, actor=current_user)
    except ChatNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    return ChatDeleteResultOut(**result)


@router.post("/users/{user_id}/block", response_model=ChatBlockResultOut)
def chat_block_user(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_support),
) -> ChatBlockResultOut:
    try:
        result = set_user_blocked(db, target_user_id=user_id, blocked=True)
    except ChatNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return ChatBlockResultOut(**result)


@router.post("/users/{user_id}/unblock", response_model=ChatBlockResultOut)
def chat_unblock_user(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_support),
) -> ChatBlockResultOut:
    try:
        result = set_user_blocked(db, target_user_id=user_id, blocked=False)
    except ChatNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return ChatBlockResultOut(**result)
