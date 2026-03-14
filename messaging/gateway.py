from core.logger import get_logger
from core.business_loader import load_business_by_token, load_business_by_connection_id
from conversation_archive.archive_service import ConversationArchiveService

logger = get_logger()

_UNAVAILABLE = "Service temporarily unavailable."


class MessagingGateway:
    """Entry point for all incoming Telegram messages."""

    def __init__(self, bot_client, business_client, router):
        self.bot_client = bot_client
        self.business_client = business_client
        self.router = router

    async def handle_incoming(self, message, bot_token: str):
        user_id = str(message.from_user.id)
        connection_id = getattr(message, "business_connection_id", None)

        from database.repository import Repository
        db = next(Repository.get_db())

        # ── 1. Identify & load business (joins ai_providers registry) ────────
        if connection_id:
            business = load_business_by_connection_id(db, connection_id)
            if not business:
                # connection_id not stored in DB — fall back to bot token
                logger.info(f"connection_id not found in DB, falling back to bot token lookup")
                business = load_business_by_token(db, bot_token)
        else:
            business = load_business_by_token(db, bot_token)

        # ── 2. Validate business ─────────────────────────────────────────────
        if business is None:
            logger.warning(f"Unregistered token/connection — dropping message from user {user_id}")
            return

        if business.subscription_status != "active":
            logger.info(f"Business '{business.name}' is not active — not calling AI.")
            await self._reply(bot_token, user_id, connection_id, _UNAVAILABLE)
            return

        if not business.ai_api_key:
            logger.warning(f"Business '{business.name}' has no ai_api_key — not calling AI.")
            await self._reply(bot_token, user_id, connection_id, _UNAVAILABLE)
            return

        # ── 3. Track conversation ────────────────────────────────────────────
        from core.session_manager import SessionManager
        session = SessionManager.get_session(user_id)

        if "conversation_id" not in session:
            conv_id = ConversationArchiveService.start_conversation(db, user_id, business.id)
            session["conversation_id"] = conv_id
            session["business_id"] = business.id
        else:
            conv_id = session["conversation_id"]

        # ── 4. Log incoming message ──────────────────────────────────────────
        ConversationArchiveService.log_message(db, conv_id, sender="user", text=message.text or "")

        # ── 5. Build normalized message ──────────────────────────────────────
        class NormalizedMessage:
            def __init__(self, user_id, text, business_config, business_connection_id=None):
                self.user_id = user_id
                self.text = text
                self.business_config = business_config
                self.business_id = business_config.id
                self.business_connection_id = business_connection_id
                # Filled in by router before features are called
                self.ai_engine = None
                self.system_prompt = ""

        normalized = NormalizedMessage(
            user_id=user_id,
            text=message.text or "",
            business_config=business,
            business_connection_id=connection_id,
        )

        logger.debug(
            f"Gateway → Router | user={user_id} business='{business.name}' "
            f"provider={business.ai_provider} assistant={business.assistant_type}"
        )

        # ── 6. Route through core router ─────────────────────────────────────
        response_text = await self.router.route_message(normalized)

        if not response_text:
            return  # spam protection drop

        # ── 7. Log bot response ──────────────────────────────────────────────
        ConversationArchiveService.log_message(db, conv_id, sender="bot", text=response_text)

        # ── 8. Send reply ────────────────────────────────────────────────────
        await self._reply(bot_token, user_id, connection_id, response_text)

    async def _reply(self, bot_token, user_id, connection_id, text):
        if connection_id:
            await self.business_client.send_message(bot_token, user_id, text, connection_id)
        else:
            await self.bot_client.send_message(bot_token, user_id, text)
