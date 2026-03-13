from core.logger import get_logger

logger = get_logger()

class TelegramBusinessClient:
    """Handles Telegram Business API communication."""
    
    def __init__(self):
        self.bot = None
        logger.info("Initialized TelegramBusinessClient")

    def set_bot(self, bot):
        self.bot = bot

    async def send_message(self, user_id: str, text: str, business_connection_id: str):
        if not self.bot:
            logger.error("TelegramBusinessClient: Bot instance not set. Cannot send message.")
            return

        logger.info(f"TelegramBusinessClient sending message to {user_id} via connection {business_connection_id}: {text}")
        try:
            await self.bot.send_message(
                chat_id=user_id, 
                text=text, 
                business_connection_id=business_connection_id
            )
        except Exception as e:
            logger.error(f"Failed to send business message to {user_id}: {e}")

