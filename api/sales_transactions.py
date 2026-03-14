from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from database.repository import Repository
from database.models import Sale, Product
from api.auth import get_current_user
from database.admin_users import AdminUser

router = APIRouter(prefix="/api/sales", tags=["Sales"])


def _biz_id(current_user: AdminUser, business_id: Optional[int] = None) -> int:
    if current_user.role == "SUPER_ADMIN":
        if not business_id:
            raise HTTPException(status_code=400, detail="business_id query param required for super admin")
        return business_id
    if not current_user.business_id:
        raise HTTPException(status_code=403, detail="No business linked to this account")
    return current_user.business_id


class SaleCreate(BaseModel):
    customer_name: Optional[str] = None
    phone: Optional[str] = None
    product_id: Optional[int] = None
    quantity: int = 1
    price: float
    discount: float = 0.0


@router.get("")
def list_sales(
    business_id: Optional[int] = None,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    biz_id = _biz_id(current_user, business_id)
    sales = (
        db.query(Sale)
        .filter(Sale.business_id == biz_id)
        .order_by(Sale.id.desc())
        .limit(200)
        .all()
    )

    result = []
    for s in sales:
        product = db.query(Product).filter(Product.id == s.product_id).first() if s.product_id else None
        result.append({
            "id": s.id,
            "customer_name": s.customer_name,
            "phone": s.phone,
            "product": product.name if product else None,
            "product_id": s.product_id,
            "quantity": s.quantity or 1,
            "price": s.price or 0,
            "discount": s.discount or 0,
            "final_price": s.final_price or 0,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        })
    return result


@router.post("")
def record_sale(
    body: SaleCreate,
    business_id: Optional[int] = None,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    biz_id = _biz_id(current_user, business_id)

    # Calculate final price
    discount_amount = body.price * (body.discount / 100.0) if body.discount else 0
    final_price = round((body.price - discount_amount) * body.quantity, 2)

    sale = Sale(
        business_id=biz_id,
        customer_name=body.customer_name,
        phone=body.phone,
        product_id=body.product_id,
        quantity=body.quantity,
        price=body.price,
        discount=body.discount,
        final_price=final_price,
        created_at=datetime.utcnow(),
    )
    db.add(sale)

    # Decrement stock if product linked
    if body.product_id:
        product = db.query(Product).filter(
            Product.id == body.product_id,
            Product.business_id == biz_id,
        ).first()
        if product and product.quantity is not None:
            product.quantity = max(0, product.quantity - body.quantity)

    db.commit()
    db.refresh(sale)
    return {"id": sale.id, "final_price": sale.final_price}
