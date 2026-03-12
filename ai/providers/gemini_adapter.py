from ai.ai_interface import AIInterface
from core.logger import get_logger

logger = get_logger()

class GeminiAdapter(AIInterface):
    """Implementation of AIInterface using Google Gemini (Skeleton)."""
    
    def __init__(self, api_key: str = None):
        logger.info("Initialized GeminiAdapter (Skeleton)")

    async def detect_intent(self, text: str) -> str:
        logger.warning("Gemini detect_intent not fully implemented")
        return "faq"

    async def generate_reply(self, context: dict, prompt: str) -> str:
        return "Gemini response skeleton"
