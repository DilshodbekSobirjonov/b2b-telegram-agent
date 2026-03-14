from ai.ai_interface import AIInterface
from core.logger import get_logger

logger = get_logger()

try:
    from anthropic import AsyncAnthropic
except ImportError:
    AsyncAnthropic = None

_DEFAULT_MODEL = "claude-haiku-4-5-20251001"


class AnthropicAdapter(AIInterface):
    """Anthropic Claude implementation."""

    def __init__(self, api_key: str, model: str = None):
        if not AsyncAnthropic:
            raise RuntimeError("Anthropic SDK not installed. Run: pip install anthropic")
        self.client = AsyncAnthropic(api_key=api_key)
        self.model = model or _DEFAULT_MODEL
        logger.info(f"AnthropicAdapter ready (model={self.model})")

    async def detect_intent(self, text: str) -> str:
        prompt = (
            "You are an intent router for a B2B assistant. "
            "Read the user message and return exactly one word from: 'booking', 'crm', 'faq'. "
            "If unsure, return 'faq'.\n"
            f"User message: {text}"
        )
        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=10,
                messages=[{"role": "user", "content": prompt}],
            )
            intent = response.content[0].text.strip().lower()
            for valid in ["booking", "crm", "faq"]:
                if valid in intent:
                    return valid
            return "faq"
        except Exception as e:
            logger.error(f"Anthropic intent detection failed: {e}")
            return "faq"

    async def generate_reply(self, context: dict, prompt: str) -> str:
        system_prompt = context.get("system", "")
        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=500,
                system=system_prompt,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.content[0].text.strip()
        except Exception as e:
            logger.error(f"Anthropic generation failed: {e}")
            return "Sorry, I am having trouble processing your request right now."
