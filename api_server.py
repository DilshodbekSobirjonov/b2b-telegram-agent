"""
B2B Telegram Agent — single entry point.

Runs the Admin API + Telegram webhook receiver in one uvicorn process.
No separate main.py / polling process needed.

Start with:
    uvicorn api_server:app --host 0.0.0.0 --port 8000
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from core.logger import get_logger
logger = get_logger()

# ── DB ────────────────────────────────────────────────────────────────────────
from database.repository import Repository, engine, SessionLocal
from database.models import Base, Business
from database.admin_users import seed_default_users
Base.metadata.create_all(bind=engine)


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await _startup()
    yield
    await _shutdown()


async def _startup():
    logger.info("=== B2B Telegram Agent starting ===")

    # Seed default super admin
    with SessionLocal() as db:
        seed_default_users(db)

    # Register feature handlers
    from core.feature_registry import register_feature
    from features.booking.handler import BookingHandler
    from features.crm.handler import CRMHandler
    from features.faq.handler import FAQHandler
    register_feature("booking", BookingHandler)
    register_feature("crm", CRMHandler)
    register_feature("faq", FAQHandler)

    # Build gateway
    from core.router import MessageRouter
    from messaging.bot_registry import registry
    from messaging.gateway import MessagingGateway
    from messaging.telegram_bot.bot_client import WebhookBotClient
    from messaging.telegram_business.business_client import TelegramBusinessClient
    from api.webhooks import set_gateway

    bot_client = WebhookBotClient(registry)
    biz_client = TelegramBusinessClient(registry)
    gateway = MessagingGateway(
        bot_client=bot_client,
        business_client=biz_client,
        router=MessageRouter(),
    )
    set_gateway(gateway)

    # Register webhooks for every business that has a bot token
    base_url = os.getenv("WEBHOOK_BASE_URL", "").rstrip("/")
    with SessionLocal() as db:
        tokens = [
            b.telegram_token.strip()
            for b in db.query(Business).filter(Business.telegram_token.isnot(None)).all()
            if b.telegram_token and b.telegram_token.strip()
        ]

    if not tokens:
        logger.warning("No bot tokens found in DB — no webhooks registered.")
        return

    if not base_url:
        logger.warning(
            "WEBHOOK_BASE_URL is not set. Bots loaded into registry but webhooks NOT registered.\n"
            "Set WEBHOOK_BASE_URL in .env and call POST /api/webhooks/register-all to activate."
        )
        for token in tokens:
            registry.register(token)
        return

    registered = 0
    for token in set(tokens):
        bot = registry.register(token)
        url = f"{base_url}/webhook/{token}"
        try:
            await bot.set_webhook(url, drop_pending_updates=True)
            logger.info(f"Webhook registered: ...{token[-6:]} → {url}")
            registered += 1
        except Exception as e:
            logger.error(f"Failed to register webhook for token ...{token[-6:]}: {e}")

    logger.info(f"=== Startup complete — {registered}/{len(set(tokens))} webhook(s) active ===")


async def _shutdown():
    from messaging.bot_registry import registry
    await registry.close_all()
    logger.info("=== Shutdown complete ===")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="B2B Telegram Agent",
    description="Admin API + Telegram webhook receiver",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://grateful-alignment-production.up.railway.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ── Routers ───────────────────────────────────────────────────────────────────
from api.auth import router as auth_router
from api.dashboard import router as dashboard_router
from api.businesses import router as businesses_router
from api.bookings import router as bookings_router
from api.products import router as products_router
from api.sales_transactions import router as sales_router
from api.clients import router as clients_router
from api.conversations import router as conversations_router
from api.ai_providers import router as ai_providers_router
from api.webhooks import webhook_router, mgmt_router

app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(businesses_router)
app.include_router(bookings_router)
app.include_router(products_router)
app.include_router(sales_router)
app.include_router(clients_router)
app.include_router(conversations_router)
app.include_router(ai_providers_router)
app.include_router(webhook_router)   # POST /webhook/{bot_token}
app.include_router(mgmt_router)      # /api/webhooks/*


@app.get("/")
def health_check():
    from messaging.bot_registry import registry
    return {
        "status": "ok",
        "service": "B2B Telegram Agent",
        "mode": "webhook",
        "bots_loaded": len(registry.all_tokens()),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_server:app", host="0.0.0.0", port=int(os.getenv("SERVER_PORT", 8000)), reload=True)
