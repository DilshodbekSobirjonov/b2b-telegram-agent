from ai.ai_interface import AIInterface
from core.logger import get_logger

logger = get_logger()

class OpenAIAdapter(AIInterface):
    """Implementation of AIInterface using OpenAI (Skeleton)."""
    
    def __init__(self, api_key: str = None):
        logger.info("Initialized OpenAIAdapter (Skeleton)")

    async def detect_intent(self, text: str) -> str:
        logger.warning("OpenAI detect_intent not fully implemented")
        return "faq"

    async def generate_reply(self, context: dict, prompt: str) -> str:
        return "OpenAI response skeleton"
