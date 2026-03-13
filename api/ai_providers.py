from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from database.repository import Repository
from database.models import AIProvider
from api.auth import get_current_user
from database.admin_users import AdminUser

router = APIRouter(prefix="/api/ai-providers", tags=["AI Providers"])

class AIProviderSchema(BaseModel):
    id: Optional[int] = None
    name: str
    api_key: str
    base_url: Optional[str] = None
    model_name: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True

class AIProviderPatch(BaseModel):
    name: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model_name: Optional[str] = None
    is_active: Optional[bool] = None

def require_super_admin(current_user: AdminUser = Depends(get_current_user)):
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Super Admin access required")
    return current_user

@router.get("", response_model=List[AIProviderSchema])
def list_providers(
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(require_super_admin)
):
    return db.query(AIProvider).all()

@router.post("")
def create_provider(
    body: AIProviderSchema,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(require_super_admin)
):
    provider = AIProvider(**body.dict())
    db.add(provider)
    db.commit()
    return {"message": "AI Provider created"}

@router.patch("/{provider_id}")
def update_provider(
    provider_id: int,
    body: AIProviderPatch,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(require_super_admin)
):
    provider = db.query(AIProvider).filter(AIProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    for key, value in body.dict(exclude_unset=True).items():
        setattr(provider, key, value)
        
    db.commit()
    return {"message": "AI Provider updated"}

@router.delete("/{provider_id}")
def delete_provider(
    provider_id: int,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(require_super_admin)
):
    provider = db.query(AIProvider).filter(AIProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    db.delete(provider)
    db.commit()
    return {"message": "AI Provider deleted"}
