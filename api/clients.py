from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database.repository import Repository
from database.models import Conversation, Appointment
from api.auth import get_current_user
from database.admin_users import AdminUser

router = APIRouter(prefix="/api/clients", tags=["Clients"])


@router.get("")
def list_clients(
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Return a list of unique client user_ids with last interaction time."""
    q = db.query(
        Conversation.user_id,
        func.max(Conversation.start_time).label("last_seen"),
        func.count(Conversation.id).label("conv_count"),
    ).group_by(Conversation.user_id)

    if current_user.role == "BUSINESS_ADMIN":
        q = q.filter(Conversation.business_id == current_user.business_id)

    rows = q.order_by(func.max(Conversation.start_time).desc()).limit(100).all()

    return [
        {
            "id": row.user_id,
            "name": f"User {row.user_id[:8]}",
            "lastSeen": row.last_seen.strftime("%Y-%m-%d %H:%M") if row.last_seen else "N/A",
            "convCount": row.conv_count,
            "status": "active",
        }
        for row in rows
    ]


@router.get("/{user_id}/conversations")
def client_conversations(
    user_id: str,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    q = db.query(Conversation).filter(Conversation.user_id == user_id)
    if current_user.role == "BUSINESS_ADMIN":
        q = q.filter(Conversation.business_id == current_user.business_id)
    convs = q.order_by(Conversation.start_time.desc()).all()
    return [
        {
            "id": c.id,
            "date": c.start_time.strftime("%Y-%m-%d") if c.start_time else "N/A",
            "summary": "Conversation archived — view messages below.",
        }
        for c in convs
    ]
