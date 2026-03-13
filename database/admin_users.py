from sqlalchemy import Column, Integer, String
from database.models import Base
import bcrypt


class AdminUser(Base):
    __tablename__ = 'admin_users'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'SUPER_ADMIN' or 'BUSINESS_ADMIN'
    business_id = Column(Integer, nullable=True)  # Only for BUSINESS_ADMIN


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def seed_default_users(db):
    """Seed default admin and business users if they don't exist."""
    existing = db.query(AdminUser).count()
    if existing == 0:
        db.add(AdminUser(
            username="admin",
            hashed_password=hash_password("admin123"),
            role="SUPER_ADMIN",
        ))
        db.add(AdminUser(
            username="biz",
            hashed_password=hash_password("biz123"),
            role="BUSINESS_ADMIN",
            business_id=1,
        ))
        db.commit()
