from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional

from database.repository import Repository
from database.models import Business, Subscription, Conversation, BusinessFeature, AIProvider
from api.auth import get_current_user
from database.admin_users import AdminUser

router = APIRouter(prefix="/api/businesses", tags=["Businesses"])


class BusinessCreate(BaseModel):
    name: str
    login: str
    password: str
    plan: str = "Starter"
    telegram_token: str
    ai_provider_id: int             # FK to ai_providers.id
    ai_rules: Optional[str] = None
    assistant_type: str = "sales"   # sales | booking
    working_hours: str
    timezone: str


class AIRulesUpdate(BaseModel):
    ai_rules: str


class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    subscription_status: Optional[str] = None
    plan: Optional[str] = None
    ai_provider_id: Optional[int] = None
    ai_rules: Optional[str] = None
    assistant_type: Optional[str] = None
    working_hours: Optional[str] = None
    timezone: Optional[str] = None


def require_super_admin(current_user: AdminUser = Depends(get_current_user)):
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Super Admin access required")
    return current_user


@router.get("/my")
def get_my_business(
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    """Returns the business linked to the currently authenticated admin."""
    if not current_user.business_id:
        raise HTTPException(status_code=404, detail="No business linked to this account")
    biz = db.query(Business).filter(Business.id == current_user.business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    return {
        "id": biz.id,
        "name": biz.name,
        "ai_rules": biz.ai_rules or "",
        "assistant_type": biz.assistant_type,
        "working_hours": biz.working_hours,
        "timezone": biz.timezone,
    }


@router.patch("/my/rules")
def update_my_ai_rules(
    body: AIRulesUpdate,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    """Allows a business admin to update their own AI rules."""
    if not current_user.business_id:
        raise HTTPException(status_code=404, detail="No business linked to this account")
    biz = db.query(Business).filter(Business.id == current_user.business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    biz.ai_rules = body.ai_rules
    db.commit()
    return {"message": "AI rules updated", "ai_rules": biz.ai_rules}


@router.get("")
def list_businesses(
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(require_super_admin),
):
    businesses = db.query(Business).all()
    result = []
    for biz in businesses:
        sub = db.query(Subscription).filter(
            Subscription.business_id == biz.id
        ).order_by(Subscription.id.desc()).first()

        client_count = (
            db.query(func.count(func.distinct(Conversation.user_id)))
            .filter(Conversation.business_id == biz.id)
            .scalar() or 0
        )

        ai_feature = db.query(BusinessFeature).filter(
            BusinessFeature.business_id == biz.id,
            BusinessFeature.feature_name == "ai_enabled",
        ).first()

        provider = db.query(AIProvider).filter(
            AIProvider.id == biz.ai_provider_id
        ).first() if biz.ai_provider_id else None

        result.append({
            "id": biz.id,
            "name": biz.name,
            "status": biz.subscription_status,
            "plan": sub.plan if sub else "Free",
            "nextPayment": sub.expire_date.strftime("%Y-%m-%d") if sub and sub.expire_date else "N/A",
            "clients": client_count,
            "aiEnabled": ai_feature.is_enabled if ai_feature else False,
            "aiProviderName": provider.name if provider else None,
            "aiProviderType": provider.provider if provider else None,
        })
    return result


@router.post("")
async def create_business(
    body: BusinessCreate,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(require_super_admin),
):
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Business name is required")
    if not body.login.strip():
        raise HTTPException(status_code=400, detail="Admin login is required")
    if not body.password.strip():
        raise HTTPException(status_code=400, detail="Admin password is required")
    if not body.telegram_token.strip():
        raise HTTPException(status_code=400, detail="Telegram bot token is required")

    # Validate AI provider exists
    provider = db.query(AIProvider).filter(AIProvider.id == body.ai_provider_id).first()
    if not provider:
        raise HTTPException(status_code=400, detail="Selected AI provider does not exist")
    if not provider.is_active:
        raise HTTPException(status_code=400, detail="Selected AI provider is inactive")

    from database.admin_users import hash_password
    if db.query(AdminUser).filter(AdminUser.username == body.login).first():
        raise HTTPException(status_code=400, detail="Login already taken")

    biz = Business(
        name=body.name,
        telegram_token=body.telegram_token,
        ai_provider_id=body.ai_provider_id,
        ai_rules=body.ai_rules,
        assistant_type=body.assistant_type,
        subscription_status="active",
        working_hours=body.working_hours,
        timezone=body.timezone,
    )
    db.add(biz)
    db.flush()

    db.add(AdminUser(
        username=body.login,
        hashed_password=hash_password(body.password),
        role="BUSINESS_ADMIN",
        business_id=biz.id,
    ))

    from database.models import Subscription
    from datetime import datetime, timedelta
    db.add(Subscription(
        business_id=biz.id,
        plan=body.plan,
        expire_date=datetime.utcnow() + timedelta(days=30),
        status="active",
    ))

    db.commit()
    db.refresh(biz)

    # Register webhook for the new bot immediately
    import os
    from messaging.bot_registry import registry
    base_url = os.getenv("WEBHOOK_BASE_URL", "").rstrip("/")
    webhook_registered = False
    if base_url and body.telegram_token:
        bot = registry.register(body.telegram_token)
        try:
            await bot.set_webhook(f"{base_url}/webhook/{body.telegram_token}", drop_pending_updates=True)
            webhook_registered = True
        except Exception as e:
            pass  # Non-fatal — admin can re-register via /api/webhooks/register-all

    return {
        "id": biz.id,
        "name": biz.name,
        "status": biz.subscription_status,
        "admin_user": body.login,
        "webhook_registered": webhook_registered,
    }


@router.patch("/{business_id}")
def update_business(
    business_id: int,
    body: BusinessUpdate,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(require_super_admin),
):
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    if body.ai_provider_id is not None:
        provider = db.query(AIProvider).filter(AIProvider.id == body.ai_provider_id).first()
        if not provider:
            raise HTTPException(status_code=400, detail="Selected AI provider does not exist")

    for field, value in body.model_dump(exclude_unset=True).items():
        if field == "plan":
            continue  # plan lives in subscriptions table
        setattr(biz, field, value)

    db.commit()
    return {"id": biz.id, "name": biz.name, "status": biz.subscription_status}


@router.delete("/{business_id}")
def delete_business(
    business_id: int,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(require_super_admin),
):
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    db.delete(biz)
    db.commit()
    return {"message": "Business deleted"}
