from ai.ai_interface import AIInterface
from core.logger import get_logger
import os

logger = get_logger()

try:
    from anthropic import AsyncAnthropic
except ImportError:
    AsyncAnthropic = None

class AnthropicAdapter(AIInterface):
    """Implementation of AIInterface using Anthropic Claude."""
    
    def __init__(self, api_key: str = None):
        if not AsyncAnthropic:
            raise RuntimeError("Anthropic SDK not installed.")
        
        self.api_key = api_key or os.getenv("AI_API_KEY")
        if not self.api_key:
            raise ValueError("Anthropic API key is missing.")
            
        self.client = AsyncAnthropic(api_key=self.api_key)
        self.model = "claude-3-haiku-20240307" # Fast, cost-effective routing model
        logger.info("Initialized AnthropicAdapter")

    async def detect_intent(self, text: str) -> str:
        logger.debug(f"Anthropic detecting intent for: {text}")
        prompt = (
            "You are an intent router for a B2B SaaS. Read the user's message and return exactly one word "
            "from the following list representing their intent: 'booking', 'crm', 'faq'. "
            f"If unsure, return 'faq'.\nUser message: {text}"
        )
        
        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=10,
                messages=[{"role": "user", "content": prompt}]
            )
            intent = response.content[0].text.strip().lower()
            logger.debug(f"Anthropic raw intent detected: {intent}")
            
            # Simple sanitization
            for valid in ["booking", "crm", "faq"]:
                if valid in intent:
                    return valid
            return "faq"
            
        except Exception as e:
            logger.error(f"Anthropic intent detection failed: {e}")
            return "faq"

    async def generate_reply(self, context: dict, prompt: str) -> str:
        logger.debug(f"Anthropic generating reply with prompt length {len(prompt)}")
        system_context = context.get("system", "")
        
        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=500,
                system=system_context,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text.strip()
        except Exception as e:
            logger.error(f"Anthropic generation failed: {e}")
            return "Sorry, I am having trouble processing your request right now."
