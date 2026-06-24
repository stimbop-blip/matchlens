from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models.user import User
from app.schemas.chat import ChatHistoryOut, ChatMessageOut, ChatMessageSendIn
from app.services.chat_service import list_recent_messages, send_message

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
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ChatMessageOut(**item)
