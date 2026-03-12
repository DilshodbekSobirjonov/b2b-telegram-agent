from core.logger import get_logger

logger = get_logger()

class TranscriptBuilder:
    """Builds a formatted readable transcript string/file from a conversation's messages."""
    
    @staticmethod
    def build_transcript(conversation_id: str) -> str:
        logger.info(f"Building transcript for conversation {conversation_id}")
        # In a real implementation, query the MessageLog table for this ID
        return f"--- Transcript for {conversation_id} ---\n(Empty Mock)"
