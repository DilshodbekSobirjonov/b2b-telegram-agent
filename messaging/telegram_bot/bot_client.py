from core.logger import get_logger
from aiogram import Bot, Dispatcher, types
from aiogram.types import Message
import asyncio

logger = get_logger()

class TelegramBotClient:
    """Handles standard Bot API communication using aiogram."""
    
    def __init__(self, token: str):
        self.token = token
        self.bot = Bot(token=self.token)
        self.dp = Dispatcher()
        logger.info("Initialized TelegramBotClient (aiogram)")

    async def send_message(self, user_id: str, text: str):
        logger.info(f"TelegramBotClient sending message to {user_id}: {text}")
        try:
            await self.bot.send_message(chat_id=user_id, text=text)
        except Exception as e:
            logger.error(f"Failed to send message to {user_id}: {e}")

    def register_handlers(self, gateway_callback):
        """Registers the main message handler to route all incoming messages to the Gateway."""
        @self.dp.message()
        async def handle_all_messages(message: Message):
            # Pass the raw aiogram Message object (or a normalized dict) to the gateway
            await gateway_callback(message)
            
    async def start_polling(self):
        """Starts the aiogram dispatcher polling."""
        logger.info("Bot started polling...")
        await self.dp.start_polling(self.bot)
