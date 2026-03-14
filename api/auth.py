from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os

from database.repository import Repository
from database.admin_users import AdminUser, verify_password, hash_password

router = APIRouter(prefix="/api/auth", tags=["Auth"])

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY is not set. "
        "Add it to your .env file before starting the server.\n"
        "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 72

security = HTTPBearer(auto_error=False)

class LoginRequest(BaseModel):
    username: str
    password: str

def create_access_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload.update({"exp": expire})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(Repository.get_db)
) -> AdminUser:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    user = db.query(AdminUser).filter(AdminUser.username == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_super_admin(current_user: AdminUser = Depends(get_current_user)) -> AdminUser:
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Super Admin privileges required")
    return current_user


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(Repository.get_db)):
    user = db.query(AdminUser).filter(AdminUser.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    assistant_type = None
    if user.business_id:
        from database.models import Business
        biz = db.query(Business).filter(Business.id == user.business_id).first()
        if biz:
            assistant_type = biz.assistant_type

    token = create_access_token({
        "sub": user.username,
        "role": user.role,
        "user_id": user.id,
        "business_id": user.business_id,
    })
    return {
        "token": token,
        "role": user.role,
        "username": user.username,
        "user_id": user.id,
        "business_id": user.business_id,
        "assistant_type": assistant_type
    }


@router.post("/logout")
def logout():
    return {"message": "Logged out"}


@router.get("/session")
def get_session(
    current_user: AdminUser = Depends(get_current_user),
    db: Session = Depends(Repository.get_db),
):
    assistant_type = None
    if current_user.business_id:
        from database.models import Business
        biz = db.query(Business).filter(Business.id == current_user.business_id).first()
        if biz:
            assistant_type = biz.assistant_type

    return {
        "user_id": current_user.id,
        "username": current_user.username,
        "role": current_user.role,
        "business_id": current_user.business_id,
        "assistant_type": assistant_type,
    }


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    current_user.hashed_password = hash_password(req.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
