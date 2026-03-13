import asyncio
import os
from dotenv import load_dotenv

from core.logger import get_logger
from core.feature_registry import register_feature
from core.router import MessageRouter
from messaging.gateway import MessagingGateway
from messaging.telegram_bot.bot_client import TelegramBotClient
from messaging.telegram_business.business_client import TelegramBusinessClient
from ai import load_ai_provider
from database.repository import Repository

# Features
from features.booking.handler import BookingHandler
from features.crm.handler import CRMHandler
from features.faq.handler import FAQHandler

logger = get_logger()

async def main():
    logger.info("Starting B2B Telegram Agent...")

    # Load Env
    load_dotenv()
    
    # Init DB
    Repository.init_db()

    # 1. Register Features dynamically
    logger.info("Registering features...")
    register_feature("booking", BookingHandler)
    register_feature("crm", CRMHandler)
    register_feature("faq", FAQHandler)

    # 2. Load AI Provider
    ai_engine = load_ai_provider()

    # 3. Setup Core Router
    router = MessageRouter(ai_engine=ai_engine)

    # 4. Setup Messaging Clients
    tp_bot = TelegramBotClient(os.getenv("TELEGRAM_TOKEN"))
    tp_biz = TelegramBusinessClient()
    tp_biz.set_bot(tp_bot.bot)

    # 5. Connect Gateway
    gateway = MessagingGateway(bot_client=tp_bot, business_client=tp_biz, router=router)
    
    # Register the bot handlers pointing to the gateway (handled standard + business updates)
    tp_bot.register_handlers(gateway.handle_incoming)


    logger.info("Agent initialized and ready. Starting live Telegram polling...")
    
    # Start actual aiogram polling
    await tp_bot.start_polling()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Agent stopped.")
