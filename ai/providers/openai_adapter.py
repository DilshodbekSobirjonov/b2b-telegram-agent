from ai.ai_interface import AIInterface
from core.logger import get_logger

logger = get_logger()

try:
    from openai import AsyncOpenAI
except ImportError:
    AsyncOpenAI = None

_DEFAULT_MODEL = "gpt-4o-mini"


class OpenAIAdapter(AIInterface):
    """OpenAI ChatGPT implementation."""

    def __init__(self, api_key: str, model: str = None):
        if not AsyncOpenAI:
            raise RuntimeError("OpenAI SDK not installed. Run: pip install openai")
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model or _DEFAULT_MODEL
        logger.info(f"OpenAIAdapter ready (model={self.model})")

    async def detect_intent(self, text: str) -> str:
        prompt = (
            "You are an intent router for a B2B assistant. "
            "Read the user message and return exactly one word from: 'booking', 'crm', 'faq'. "
            "If unsure, return 'faq'.\n"
            f"User message: {text}"
        )
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                max_tokens=10,
                messages=[{"role": "user", "content": prompt}],
            )
            intent = response.choices[0].message.content.strip().lower()
            for valid in ["booking", "crm", "faq"]:
                if valid in intent:
                    return valid
            return "faq"
        except Exception as e:
            logger.error(f"OpenAI intent detection failed: {e}")
            return "faq"

    async def generate_reply(self, context: dict, prompt: str) -> str:
        system_prompt = context.get("system", "")
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                max_tokens=500,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI generation failed: {e}")
            return "Sorry, I am having trouble processing your request right now."
