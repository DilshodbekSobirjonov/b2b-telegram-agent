from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from database.repository import Repository
from database.models import Product
from api.auth import get_current_user
from database.admin_users import AdminUser

router = APIRouter(prefix="/api/products", tags=["Products"])


def _biz_id(current_user: AdminUser, business_id: Optional[int] = None) -> int:
    if current_user.role == "SUPER_ADMIN":
        if not business_id:
            raise HTTPException(status_code=400, detail="business_id query param required for super admin")
        return business_id
    if not current_user.business_id:
        raise HTTPException(status_code=403, detail="No business linked to this account")
    return current_user.business_id


class ProductCreate(BaseModel):
    name: str
    price: float = 0.0
    quantity: int = 0
    category: Optional[str] = None
    discount: float = 0.0
    active: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    category: Optional[str] = None
    discount: Optional[float] = None
    active: Optional[bool] = None


@router.get("")
def list_products(
    business_id: Optional[int] = None,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    biz_id = _biz_id(current_user, business_id)
    products = db.query(Product).filter(Product.business_id == biz_id).order_by(Product.id.desc()).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "price": p.price or 0,
            "quantity": p.quantity or 0,
            "category": p.category,
            "discount": p.discount or 0,
            "active": p.active if p.active is not None else True,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in products
    ]


@router.post("")
def create_product(
    body: ProductCreate,
    business_id: Optional[int] = None,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    biz_id = _biz_id(current_user, business_id)
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Product name is required")

    p = Product(
        business_id=biz_id,
        name=body.name.strip(),
        price=body.price,
        quantity=body.quantity,
        category=body.category,
        discount=body.discount,
        active=body.active,
        created_at=datetime.utcnow(),
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return {"id": p.id, "name": p.name}


@router.patch("/{product_id}")
def update_product(
    product_id: int,
    body: ProductUpdate,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")

    # Enforce ownership for business admin
    if current_user.role == "BUSINESS_ADMIN" and p.business_id != current_user.business_id:
        raise HTTPException(status_code=403, detail="Access denied")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(p, field, value)

    db.commit()
    return {"id": p.id, "name": p.name}


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")

    if current_user.role == "BUSINESS_ADMIN" and p.business_id != current_user.business_id:
        raise HTTPException(status_code=403, detail="Access denied")

    db.delete(p)
    db.commit()
    return {"message": "Product deleted"}
