import os
from core.logger import get_logger

logger = get_logger()

from database.repository import Repository
from database.models import AIProvider, Business

def load_ai_provider(business_id=None):
    """
    Dynamically loads the chosen AI provider based on database configuration.
    If business_id is provided, loads the provider assigned to that business.
    Otherwise loads the first active global provider.
    """
    db = next(Repository.get_db())
    
    provider_name = "anthropic"
    api_key = os.getenv("ANTHROPIC_API_KEY") # Fallback to env
    
    if business_id:
        biz = db.query(Business).filter(Business.id == business_id).first()
        if biz and biz.ai_provider:
            provider_name = biz.ai_provider
            
    # Fetch provider config from DB
    db_provider = db.query(AIProvider).filter(AIProvider.name == provider_name, AIProvider.is_active == True).first()
    if db_provider:
        provider_name = db_provider.name
        api_key = db_provider.api_key
        # In a real app we might pass more config here
        
    logger.info(f"Loading AI Provider: {provider_name}")
    
    try:
        if provider_name == "anthropic":
            if not api_key:
                logger.warning("No ANTHROPIC_API_KEY found. Falling back to MockAdapter.")
                from ai.providers.mock_adapter import MockAdapter
                return MockAdapter()
            from ai.providers.anthropic_adapter import AnthropicAdapter
            return AnthropicAdapter(api_key=api_key)
            
        elif provider_name == "openai":
            if not api_key:
                logger.warning("No OPENAI_API_KEY found. Falling back to MockAdapter.")
                from ai.providers.mock_adapter import MockAdapter
                return MockAdapter()
            from ai.providers.openai_adapter import OpenAIAdapter
            return OpenAIAdapter(api_key=api_key)
            
        elif provider_name == "gemini":
            if not api_key:
                logger.warning("No GEMINI_API_KEY found. Falling back to MockAdapter.")
                from ai.providers.mock_adapter import MockAdapter
                return MockAdapter()
            from ai.providers.gemini_adapter import GeminiAdapter
            return GeminiAdapter(api_key=api_key)
            
        else:
            logger.error(f"Unknown AI_PROVIDER '{provider_name}'. Falling back to MockAdapter.")
            from ai.providers.mock_adapter import MockAdapter
            return MockAdapter()
            
    except Exception as e:
        logger.error(f"Failed to initialize AI Provider {provider_name}: {e}. Falling back to MockAdapter.")
        from ai.providers.mock_adapter import MockAdapter
        return MockAdapter()
