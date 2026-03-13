from core.logger import get_logger

logger = get_logger()

class FAQHandler:
    def __init__(self, ai_engine=None):
        self.ai_engine = ai_engine

    async def handle(self, message, session):
        logger.info(f"Handling FAQ request for user {message.user_id}")
        
        if not self.ai_engine:
            return "Извините, AI помощник временно недоступен."
            
        # Get business context data
        context_str = session.get("context_data", "")
        
        # Call the real AI provider dynamically
        response_text = await self.ai_engine.generate_response(context_str, message.text)
        return response_text
