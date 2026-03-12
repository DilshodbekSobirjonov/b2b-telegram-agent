from core.logger import get_logger

logger = get_logger()

class FAQHandler:
    async def handle(self, message, session):
        logger.info(f"Handling FAQ request for user {message.user_id}")
        # In a real implementation we would route this prompt back through the AI Provider `generate_reply`
        # For MVP we just return a static mock or use the AI layer here.
        return "Это FAQ. Я отвечу на ваш вопрос!"

class FAQLogic:
    pass

class FAQUI:
    pass
