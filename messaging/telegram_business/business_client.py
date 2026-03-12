from core.logger import get_logger

logger = get_logger()

class TelegramBusinessClient:
    """Handles Telegram Business API communication."""
    
    def __init__(self, main_bot_token: str):
        self.token = main_bot_token
        logger.info("Initialized TelegramBusinessClient")

    async def send_message(self, user_id: str, text: str, business_connection_id: str):
        logger.info(f"TelegramBusinessClient sending message to {user_id} via connection {business_connection_id}: {text}")
        # actual aiogram/requests call injecting business_connection_id would go here
