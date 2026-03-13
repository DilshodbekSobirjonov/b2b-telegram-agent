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
        """Registers handlers to route incoming standard and business updates to the Gateway."""
        
        # Standard private/group messages
        @self.dp.message()
        async def handle_standard_message(message: Message):
            # Ignore messages from the bot itself
            me = await self.bot.get_me()
            if message.from_user.id == me.id:
                return
            await gateway_callback(message)

        # Telegram Business messages
        @self.dp.business_message()
        async def handle_business_message(message: Message):
            # Ignore messages from the bot itself
            me = await self.bot.get_me()
            if message.from_user.id == me.id:
                return
            
            logger.info(f"Business message received from {message.from_user.id} (Connection: {message.business_connection_id})")
            await gateway_callback(message)

        # Telegram Business connection updates
        @self.dp.business_connection()
        async def handle_business_connection(connection: types.BusinessConnection):
            logger.info(f"Business connection update: {connection.id} is now {'enabled' if connection.is_enabled else 'disabled'}")
            # Optionally pass this to gateway if persistence is needed

            
    async def start_polling(self):
        """Starts the aiogram dispatcher polling."""
        logger.info("Bot started polling...")
        await self.dp.start_polling(self.bot)
