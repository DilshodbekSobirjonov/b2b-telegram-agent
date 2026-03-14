from datetime import datetime
from core.logger import get_logger
import uuid

logger = get_logger()


class ConversationArchiveService:
    """Persists conversations and messages to PostgreSQL."""

    @staticmethod
    def start_conversation(db, user_id: str, business_id: int) -> str:
        from database.models import Conversation

        conv_id = str(uuid.uuid4())
        conv = Conversation(
            id=conv_id,
            user_id=user_id,
            business_id=business_id,
            start_time=datetime.utcnow(),
        )
        db.add(conv)
        db.commit()
        logger.debug(f"Started conversation {conv_id} for user {user_id} / business {business_id}")
        return conv_id

    @staticmethod
    def log_message(db, conversation_id: str, sender: str, text: str):
        from database.models import MessageLog

        msg = MessageLog(
            conversation_id=conversation_id,
            sender=sender,
            text=text,
            timestamp=datetime.utcnow(),
        )
        db.add(msg)
        db.commit()
        logger.debug(f"Logged [{sender}] in conversation {conversation_id}")

    @staticmethod
    def end_conversation(db, conversation_id: str):
        from database.models import Conversation

        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conv:
            conv.end_time = datetime.utcnow()
            db.commit()
