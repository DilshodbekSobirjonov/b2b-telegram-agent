import os
from core.logger import get_logger

logger = get_logger()

def load_ai_provider():
    """Dynamically loads the chosen AI provider based on environment variables."""
    provider_name = os.getenv("AI_PROVIDER", "anthropic").lower()
    
    logger.info(f"Loading AI Provider: {provider_name}")
    
    if provider_name == "anthropic":
        from ai.providers.anthropic_adapter import AnthropicAdapter
        return AnthropicAdapter()
    elif provider_name == "openai":
        from ai.providers.openai_adapter import OpenAIAdapter
        return OpenAIAdapter()
    elif provider_name == "gemini":
        from ai.providers.gemini_adapter import GeminiAdapter
        return GeminiAdapter()
    else:
        logger.error(f"Unknown AI_PROVIDER '{provider_name}'. Falling back to Anthropic.")
        from ai.providers.anthropic_adapter import AnthropicAdapter
        return AnthropicAdapter()
