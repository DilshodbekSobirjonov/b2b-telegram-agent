from core.logger import get_logger

logger = get_logger()

class MockAdapter:
    """A safe fallback AI provider that doesn't crash when API keys are missing."""
    
    def __init__(self, api_key=None):
        logger.warning("MockAdapter initialized. AI features will use predefined safe responses.")
        self.api_key = api_key

    async def detect_intent(self, user_message: str) -> str:
        text = user_message.lower()
        if "book" in text or "appointment" in text:
            return "booking"
        elif "price" in text or "cost" in text or "faq" in text or "help" in text:
            return "faq"
        return "faq"

    async def generate_response(self, context: str, user_message: str) -> str:
        return "I am currently in safe fallback mode because the AI API key is not configured. Please contact the administrator."
