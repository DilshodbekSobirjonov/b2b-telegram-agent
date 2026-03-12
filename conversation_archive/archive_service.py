from core.logger import get_logger
from datetime import datetime
import uuid

logger = get_logger()

class ConversationArchiveService:
    """Service to handle the logging of every message to the database."""
    
    @staticmethod
    def log_message(conversation_id: str, sender: str, text: str):
        logger.info(f"Archive Log [{conversation_id}] from {sender}: {text}")
        # In a real implementation:
        # db = SessionLocal()
        # msg = MessageLog(conversation_id=conversation_id, sender=sender, text=text, timestamp=datetime.utcnow())
        # db.add(msg)
        # db.commit()

    @staticmethod
    def start_conversation(user_id: str, business_id: int = None) -> str:
        conv_id = str(uuid.uuid4())
        logger.info(f"Started new conversation {conv_id} for user {user_id}")
        return conv_id
