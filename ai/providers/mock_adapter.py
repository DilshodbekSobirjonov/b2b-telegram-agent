from core.logger import get_logger

logger = get_logger()


class MockAdapter:
    """Safe fallback — not used in production. Kept for local development without API keys."""

    def __init__(self, api_key=None):
        logger.warning("MockAdapter active — AI features return canned responses.")

    async def detect_intent(self, text: str) -> str:
        text = text.lower()
        if "book" in text or "appointment" in text:
            return "booking"
        return "faq"

    async def generate_reply(self, context: dict, prompt: str) -> str:
        return "AI is not configured for this business. Please contact the administrator."
