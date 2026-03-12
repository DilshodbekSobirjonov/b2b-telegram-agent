from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database.models import Base
from core.logger import get_logger
import os

logger = get_logger()
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./b2b_telegram_agent.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
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
