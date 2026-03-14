from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from database.repository import Repository
from database.models import AIProvider
from api.auth import get_current_user
from database.admin_users import AdminUser

router = APIRouter(prefix="/api/ai-providers", tags=["AI Providers"])

VALID_PROVIDERS = {"anthropic", "openai", "gemini"}


class AIProviderCreate(BaseModel):
    name: str
    provider: str           # anthropic | openai | gemini
    api_key: str
    model: Optional[str] = None
    is_active: bool = True


class AIProviderUpdate(BaseModel):
    name: Optional[str] = None
    provider: Optional[str] = None
    api_key: Optional[str] = None
    model: Optional[str] = None
    is_active: Optional[bool] = None


class AIProviderOut(BaseModel):
    id: int
    name: str
    provider: str
    api_key: str            # masked at the response layer in the frontend
    model: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


def require_super_admin(current_user: AdminUser = Depends(get_current_user)):
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Super Admin access required")
    return current_user


@router.get("", response_model=List[AIProviderOut])
def list_providers(
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(require_super_admin),
):
    return db.query(AIProvider).order_by(AIProvider.id).all()


@router.post("", response_model=AIProviderOut)
def create_provider(
    body: AIProviderCreate,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(require_super_admin),
):
    if body.provider not in VALID_PROVIDERS:
        raise HTTPException(status_code=400, detail=f"provider must be one of: {', '.join(VALID_PROVIDERS)}")
    if db.query(AIProvider).filter(AIProvider.name == body.name).first():
        raise HTTPException(status_code=400, detail="An AI provider with this name already exists")

    p = AIProvider(
        name=body.name,
        provider=body.provider,
        api_key=body.api_key,
        model=body.model,
        is_active=body.is_active,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.patch("/{provider_id}", response_model=AIProviderOut)
def update_provider(
    provider_id: int,
    body: AIProviderUpdate,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(require_super_admin),
):
    p = db.query(AIProvider).filter(AIProvider.id == provider_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Provider not found")
    if body.provider is not None and body.provider not in VALID_PROVIDERS:
        raise HTTPException(status_code=400, detail=f"provider must be one of: {', '.join(VALID_PROVIDERS)}")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(p, field, value)

    db.commit()
    db.refresh(p)
    return p


@router.delete("/{provider_id}")
def delete_provider(
    provider_id: int,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(require_super_admin),
):
    p = db.query(AIProvider).filter(AIProvider.id == provider_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Provider not found")
    # businesses.ai_provider_id → SET NULL on delete (enforced by FK)
    db.delete(p)
    db.commit()
    return {"message": "Provider deleted"}
