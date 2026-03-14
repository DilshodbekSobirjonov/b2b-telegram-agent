from core.logger import get_logger
from core.business_loader import BusinessConfig

logger = get_logger()


def build_ai_engine(business: BusinessConfig):
    """
    Instantiate the correct AI adapter from the business config stored in PostgreSQL.
    AI API keys come exclusively from the database — never from environment variables.

    Returns None if the business has no api_key configured.
    """
    provider = (business.ai_provider or "anthropic").lower()
    api_key = business.ai_api_key
    model = business.ai_model  # may be None — adapters have their own defaults

    if not api_key:
        logger.warning(
            f"Business '{business.name}' (id={business.id}) has no ai_api_key configured."
        )
        return None

    try:
        if provider == "anthropic":
            from ai.providers.anthropic_adapter import AnthropicAdapter
            return AnthropicAdapter(api_key=api_key, model=model)

        elif provider == "openai":
            from ai.providers.openai_adapter import OpenAIAdapter
            return OpenAIAdapter(api_key=api_key, model=model)

        elif provider == "gemini":
            from ai.providers.gemini_adapter import GeminiAdapter
            return GeminiAdapter(api_key=api_key, model=model)

        else:
            logger.error(f"Unknown ai_provider '{provider}' for business '{business.name}'.")
            return None

    except Exception as e:
        logger.error(f"Failed to initialize AI engine for business '{business.name}': {e}")
        return None
