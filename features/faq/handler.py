from core.logger import get_logger

logger = get_logger()


class FAQHandler:
    async def handle(self, message, session):
        logger.info(f"FAQHandler for user {message.user_id}")

        ai_engine = getattr(message, "ai_engine", None)
        system_prompt = getattr(message, "system_prompt", "")

        if not ai_engine:
            return "Service temporarily unavailable."

        return await ai_engine.generate_reply({"system": system_prompt}, message.text)
