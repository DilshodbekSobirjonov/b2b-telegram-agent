"""
Webhook receiver + management endpoints.

POST /webhook/{bot_token}          — Telegram calls this for every update
GET  /api/webhooks/status          — list registered webhook URLs (admin)
POST /api/webhooks/register-all    — (re)register all bot webhooks (admin)
DELETE /api/webhooks/{business_id} — delete webhook for one bot (admin)
"""
import os
from fastapi import APIRouter, Request, Response, Depends, HTTPException
from sqlalchemy.orm import Session
from aiogram.types import Update

from database.repository import Repository
from database.models import Business
from api.auth import get_current_user
from database.admin_users import AdminUser
from messaging.bot_registry import registry
from core.logger import get_logger

logger = get_logger()

# ── Routers ──────────────────────────────────────────────────────────────────
webhook_router = APIRouter(tags=["Telegram Webhooks"])
mgmt_router    = APIRouter(prefix="/api/webhooks", tags=["Webhook Management"])

# Set by api_server lifespan after gateway is created
_gateway = None


def set_gateway(gw):
    global _gateway
    _gateway = gw


# ── Telegram update receiver ─────────────────────────────────────────────────
@webhook_router.post("/webhook/{bot_token}")
async def receive_update(bot_token: str, request: Request):
    """
    Telegram posts every update here.
    Always returns 200 — even on errors — to prevent Telegram from retrying.
    """
    if not _gateway:
        logger.error("Webhook received but gateway is not initialised yet.")
        return Response(status_code=200)

    bot = registry.get(bot_token)
    if not bot:
        logger.warning(f"Webhook update for unknown token ...{bot_token[-6:]}")
        return Response(status_code=200)

    try:
        body = await request.json()
        update = Update.model_validate(body)

        message = update.message or update.business_message
        if message and message.from_user:
            await _gateway.handle_incoming(message, bot_token)
    except Exception as e:
        logger.error(f"Error processing webhook update: {e}")

    return Response(status_code=200)


# ── Admin management ─────────────────────────────────────────────────────────
def require_super_admin(current_user: AdminUser = Depends(get_current_user)):
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Super Admin access required")
    return current_user


@mgmt_router.get("/status")
async def webhook_status(
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(require_super_admin),
):
    """Show the current webhook info registered with Telegram for each bot."""
    base_url = os.getenv("WEBHOOK_BASE_URL", "").rstrip("/")
    businesses = db.query(Business).filter(Business.telegram_token.isnot(None)).all()

    result = []
    for biz in businesses:
        token = biz.telegram_token
        bot = registry.get(token)
        webhook_url = f"{base_url}/webhook/{token}" if base_url else None

        info = {"id": biz.id, "name": biz.name, "webhook_url": webhook_url, "registered": False}
        if bot:
            try:
                wh = await bot.get_webhook_info()
                info["registered"] = bool(wh.url)
                info["telegram_url"] = wh.url
                info["pending_updates"] = wh.pending_update_count
            except Exception as e:
                info["error"] = str(e)
        result.append(info)
    return result


@mgmt_router.post("/register-all")
async def register_all_webhooks(
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(require_super_admin),
):
    """(Re)register webhooks for every business that has a bot token."""
    base_url = os.getenv("WEBHOOK_BASE_URL", "").rstrip("/")
    if not base_url:
        raise HTTPException(status_code=400, detail="WEBHOOK_BASE_URL is not set in .env")

    businesses = db.query(Business).filter(Business.telegram_token.isnot(None)).all()
    registered, failed = [], []

    for biz in businesses:
        token = biz.telegram_token.strip()
        bot = registry.register(token)
        url = f"{base_url}/webhook/{token}"
        try:
            await bot.set_webhook(url, drop_pending_updates=True)
            registered.append({"id": biz.id, "name": biz.name, "url": url})
            logger.info(f"Webhook registered: {biz.name} → {url}")
        except Exception as e:
            failed.append({"id": biz.id, "name": biz.name, "error": str(e)})
            logger.error(f"Failed to register webhook for {biz.name}: {e}")

    return {"registered": registered, "failed": failed}


@mgmt_router.delete("/{business_id}")
async def delete_webhook(
    business_id: int,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(require_super_admin),
):
    """Remove the Telegram webhook for a specific business bot."""
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    if not biz.telegram_token:
        raise HTTPException(status_code=400, detail="Business has no bot token")

    bot = registry.get(biz.telegram_token)
    if not bot:
        bot = registry.register(biz.telegram_token)
    try:
        await bot.delete_webhook()
        return {"message": f"Webhook deleted for {biz.name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
