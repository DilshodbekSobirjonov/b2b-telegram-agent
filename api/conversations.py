from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.repository import Repository
from database.models import Conversation, MessageLog
from api.auth import get_current_user
from database.admin_users import AdminUser

router = APIRouter(prefix="/api/conversations", tags=["Conversations"])


@router.get("")
def list_conversations(
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    q = db.query(Conversation)
    if current_user.role == "BUSINESS_ADMIN":
        q = q.filter(Conversation.business_id == current_user.business_id)
    convs = q.order_by(Conversation.start_time.desc()).limit(100).all()
    return [
        {
            "id": c.id,
            "userId": c.user_id,
            "businessId": c.business_id,
            "startTime": c.start_time.isoformat() if c.start_time else None,
            "endTime": c.end_time.isoformat() if c.end_time else None,
        }
        for c in convs
    ]


@router.get("/{conversation_id}/messages")
def get_messages(
    conversation_id: str,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    # Verify the conversation belongs to this user's business if BUSINESS_ADMIN
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if current_user.role == "BUSINESS_ADMIN" and conv.business_id != current_user.business_id:
        raise HTTPException(status_code=403, detail="Access denied")

    messages = (
        db.query(MessageLog)
        .filter(MessageLog.conversation_id == conversation_id)
        .order_by(MessageLog.timestamp)
        .all()
    )
    return {
        "conversationId": conversation_id,
        "userId": conv.user_id,
        "summary": f"Conversation started {conv.start_time.strftime('%Y-%m-%d %H:%M') if conv.start_time else 'N/A'}",
        "messages": [
            {
                "role": m.sender,
                "text": m.text,
                "time": m.timestamp.strftime("%H:%M") if m.timestamp else "",
            }
            for m in messages
        ],
    }
