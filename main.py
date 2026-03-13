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
from database.models import Business
from aiogram import Bot

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

    # 1. Load AI Provider first
    logger.info("Loading AI Provider...")
    ai_engine = load_ai_provider()

    # 2. Register Features dynamically
    logger.info("Registering features...")
    register_feature("booking", BookingHandler)
    register_feature("crm", CRMHandler)
    register_feature("faq", FAQHandler(ai_engine=ai_engine))

    # 3. Setup Core Router
    router = MessageRouter(ai_engine=ai_engine)

    # 4. Setup Messaging Clients dynamically from DB
    db = next(Repository.get_db())
    businesses = db.query(Business).filter(Business.telegram_token.isnot(None)).all()
    
    unique_tokens = list(set([b.telegram_token for b in businesses if b.telegram_token.strip()]))
    
    if unique_tokens:
        logger.info(f"Starting Telegram Routing for {len(unique_tokens)} unique bots...")
        bot_instances = [Bot(token=t) for t in unique_tokens]
        
        tp_bot = TelegramBotClient(bots=bot_instances)
        tp_biz = TelegramBusinessClient()
        tp_biz.set_bot(bot_instances[0]) # For business logic we just need one valid bot instance for API calls

        # 5. Connect Gateway
        gateway = MessagingGateway(bot_client=tp_bot, business_client=tp_biz, router=router)
        
        # Register the bot handlers pointing to the gateway (handles standard + business updates)
        tp_bot.register_handlers(gateway.handle_incoming)

        logger.info("Agent initialized and ready. Starting live Telegram polling across all bots...")
        
        # Start actual aiogram polling
        await tp_bot.start_polling()
    else:
        logger.warning(
            "######################################################################\n"
            "No Telegram Bots found in the database! \n"
            "The backend will run, but no Telegram polling will start.\n"
            "Add a business with a Telegram Token via the Admin Panel to enable this.\n"
            "######################################################################"
        )
        # Keep process alive silently for Docker/runner without crashing
        while True:
            await asyncio.sleep(3600)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Agent stopped.")
