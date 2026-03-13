import asyncio
from core.logger import get_logger
from aiogram import Bot, Dispatcher, types
from aiogram.types import Message

logger = get_logger()

class TelegramBotClient:
    """Handles standard Bot API communication using aiogram for MULTIPLE isolated bots concurrently."""
    
    def __init__(self, bots: list[Bot]):
        self.bots = bots
        self.dp = Dispatcher()
        logger.info(f"Initialized TelegramBotClient (aiogram) with {len(bots)} isolated bots.")

    async def send_message(self, bot_token: str, user_id: str, text: str):
        # Find the specific bot to inject the message back into
        target_bot = next((b for b in self.bots if b.token == bot_token), None)
        if not target_bot:
            logger.error(f"Cannot reply to User {user_id}. Bot token {bot_token} not found in loaded instances.")
            return

        logger.info(f"TelegramBotClient [{target_bot.id}] sending message to {user_id}: {text}")
        try:
            await target_bot.send_message(chat_id=user_id, text=text)
        except Exception as e:
            logger.error(f"Failed to send message to {user_id} via bot {target_bot.id}: {e}")

    def register_handlers(self, gateway_callback):
        """Registers handlers to route incoming standard and business updates to the Gateway."""
        
        # Standard private/group messages
        @self.dp.message()
        async def handle_standard_message(message: Message, bot: Bot):
            # Ignore messages from the bot itself
            me = await bot.get_me()
            if message.from_user.id == me.id:
                return
            await gateway_callback(message, bot.token)

        # Telegram Business messages
        @self.dp.business_message()
        async def handle_business_message(message: Message, bot: Bot):
            # Ignore messages from the bot itself
            me = await bot.get_me()
            if message.from_user.id == me.id:
                return
            
            logger.info(f"Business message received on Bot {bot.id} from {message.from_user.id} (Connection: {message.business_connection_id})")
            await gateway_callback(message, bot.token)

    async def start_polling(self):
        """Starts the aiogram dispatcher polling for ALL dynamically loaded bots."""
        if not self.bots:
            logger.warning("No Telegram bots loaded to poll.")
            return
            
        logger.info(f"Bots started polling. Active instances: {len(self.bots)}")
        await self.dp.start_polling(*self.bots)

