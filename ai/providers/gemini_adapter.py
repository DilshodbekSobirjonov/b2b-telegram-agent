from ai.ai_interface import AIInterface
from core.logger import get_logger

logger = get_logger()

try:
    import google.generativeai as genai
except ImportError:
    genai = None

_DEFAULT_MODEL = "gemini-1.5-flash"


class GeminiAdapter(AIInterface):
    """Google Gemini implementation."""

    def __init__(self, api_key: str, model: str = None):
        if not genai:
            raise RuntimeError(
                "Google Generative AI SDK not installed. Run: pip install google-generativeai"
            )
        genai.configure(api_key=api_key)
        self.model_name = model or _DEFAULT_MODEL
        logger.info(f"GeminiAdapter ready (model={self.model_name})")

    async def detect_intent(self, text: str) -> str:
        prompt = (
            "You are an intent router for a B2B assistant. "
            "Read the user message and return exactly one word from: 'booking', 'crm', 'faq'. "
            "If unsure, return 'faq'.\n"
            f"User message: {text}"
        )
        try:
            model = genai.GenerativeModel(self.model_name)
            response = await model.generate_content_async(prompt)
            intent = response.text.strip().lower()
            for valid in ["booking", "crm", "faq"]:
                if valid in intent:
                    return valid
            return "faq"
        except Exception as e:
            logger.error(f"Gemini intent detection failed: {e}")
            return "faq"

    async def generate_reply(self, context: dict, prompt: str) -> str:
        system_prompt = context.get("system", "")
        full_prompt = f"{system_prompt}\n\nUser: {prompt}" if system_prompt else prompt
        try:
            model = genai.GenerativeModel(self.model_name)
            response = await model.generate_content_async(full_prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
            return "Sorry, I am having trouble processing your request right now."
