from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional

from database.repository import Repository
from database.models import Business, Subscription, Conversation, BusinessFeature
from api.auth import get_current_user
from database.admin_users import AdminUser

router = APIRouter(prefix="/api/businesses", tags=["Businesses"])


class BusinessCreate(BaseModel):
    name: str
    login: str
    password: str
    plan: str = "Starter"
    telegram_token: Optional[str] = None
    ai_provider: str = "anthropic"


class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    subscription_status: Optional[str] = None
    plan: Optional[str] = None


def require_super_admin(current_user: AdminUser = Depends(get_current_user)):
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Super Admin access required")
    return current_user


@router.get("")
def list_businesses(
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(require_super_admin)
):
    businesses = db.query(Business).all()
    result = []
    for biz in businesses:
        # Get subscription info
        sub = db.query(Subscription).filter(Subscription.business_id == biz.id).order_by(Subscription.id.desc()).first()
        
        # Client count = unique users in conversations
        client_count = (
            db.query(func.count(func.distinct(Conversation.user_id)))
            .filter(Conversation.business_id == biz.id)
            .scalar() or 0
        )
        
        # AI enabled?
        ai_feature = db.query(BusinessFeature).filter(
            BusinessFeature.business_id == biz.id,
            BusinessFeature.feature_name == "ai_enabled"
        ).first()
        
        result.append({
            "id": biz.id,
            "name": biz.name,
            "status": biz.subscription_status,
            "plan": sub.plan if sub else "Free",
            "nextPayment": sub.expire_date.strftime("%Y-%m-%d") if sub and sub.expire_date else "N/A",
            "clients": client_count,
            "aiEnabled": ai_feature.is_enabled if ai_feature else False,
        })
    return result


@router.post("")
def create_business(
    body: BusinessCreate,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(require_super_admin)
):
    # Check if login already exists
    from database.admin_users import AdminUser, hash_password
    existing_user = db.query(AdminUser).filter(AdminUser.username == body.login).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Login already taken")

    biz = Business(
        name=body.name,
        telegram_token=body.telegram_token,
        ai_provider=body.ai_provider,
        subscription_status="active"
    )
    db.add(biz)
    db.flush()
    
    # Create the AdminUser for this business
    new_admin = AdminUser(
        username=body.login,
        hashed_password=hash_password(body.password),
        role="BUSINESS_ADMIN",
        business_id=biz.id
    )
    db.add(new_admin)

    # Create default subscription
    from database.models import Subscription
    from datetime import datetime, timedelta
    sub = Subscription(
        business_id=biz.id,
        plan=body.plan,
        expire_date=datetime.utcnow() + timedelta(days=30),
        status="active"
    )
    db.add(sub)
    db.commit()
    db.refresh(biz)
    return {"id": biz.id, "name": biz.name, "status": biz.subscription_status, "admin_user": body.login}


@router.patch("/{business_id}")
def update_business(
    business_id: int,
    body: BusinessUpdate,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(require_super_admin)
):
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    if body.name is not None:
        biz.name = body.name
    if body.subscription_status is not None:
        biz.subscription_status = body.subscription_status
    db.commit()
    return {"id": biz.id, "name": biz.name, "status": biz.subscription_status}


@router.delete("/{business_id}")
def delete_business(
    business_id: int,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(require_super_admin)
):
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    db.delete(biz)
    db.commit()
    return {"message": "Business deleted"}
