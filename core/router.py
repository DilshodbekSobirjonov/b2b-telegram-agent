from core.logger import get_logger
from core.feature_registry import get_feature
from core.session_manager import SessionManager

logger = get_logger()


class MessageRouter:
    """Routes incoming messages to the appropriate feature module."""

    def __init__(self):
        pass

    async def route_message(self, message):
        user_id = str(message.user_id)
        text = message.text

        # ── 1. Build AI engine + system prompt from business config ───────────
        business = getattr(message, "business_config", None)

        if business:
            from ai import build_ai_engine
            from core.prompt_builder import build_system_prompt

            ai_engine = build_ai_engine(business)
            system_prompt = build_system_prompt(business)
        else:
            ai_engine = None
            system_prompt = ""

        # Attach to message so feature handlers can access them directly
        message.ai_engine = ai_engine
        message.system_prompt = system_prompt

        # ── 2. Retrieve session ───────────────────────────────────────────────
        session = SessionManager.get_session(user_id)
        state = session.get("state", "IDLE")

        # ── 3. Active flow (state machine) ────────────────────────────────────
        if state.startswith("booking_"):
            logger.info(f"User {user_id} in state '{state}' → booking")
            handler = get_feature("booking")
            if isinstance(handler, type):
                handler = handler()
            return await handler.handle(message, session)

        if state.startswith("crm_"):
            logger.info(f"User {user_id} in state '{state}' → crm")
            handler = get_feature("crm")
            if isinstance(handler, type):
                handler = handler()
            return await handler.handle(message, session)

        # ── 4. Detect intent ──────────────────────────────────────────────────
        if not ai_engine:
            logger.warning(f"No AI engine available for user {user_id} — cannot detect intent.")
            return "Service temporarily unavailable."

        logger.info(f"Detecting intent for user {user_id}: '{text}'")
        intent = await ai_engine.detect_intent(text)
        logger.info(f"Intent: {intent}")

        # ── 5. FAQ spam protection ────────────────────────────────────────────
        if intent == "faq":
            import time
            last_faq = session.get("last_faq_time", 0)
            if time.time() - last_faq < 5:
                logger.warning(f"FAQ spam detected for user {user_id} — dropping.")
                return None
            session["last_faq_time"] = time.time()

        # ── 6. Dispatch to feature handler ────────────────────────────────────
        handler = get_feature(intent) or get_feature("faq")

        if not handler:
            return "I'm sorry, I cannot process this request at the moment."

        if isinstance(handler, type):
            handler = handler()

        return await handler.handle(message, session)
