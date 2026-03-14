from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database.models import Base
from core.logger import get_logger
import os

logger = get_logger()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/b2b_telegram_agent")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,       # Verify connections before use (handles dropped connections)
    pool_size=10,             # Connection pool size
    max_overflow=20,          # Extra connections allowed beyond pool_size
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Repository:
    """General repository for database access."""

    @staticmethod
    def get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    @staticmethod
    def init_db():
        logger.info("Initializing database schema...")
        Base.metadata.create_all(bind=engine)
