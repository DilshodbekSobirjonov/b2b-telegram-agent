from core.logger import get_logger
from core.feature_registry import get_feature
from core.session_manager import SessionManager

logger = get_logger()

class MessageRouter:
    """Routes incoming messages using AI intent detection to the appropriate feature modules."""
    
    def __init__(self, ai_engine):
        self.ai = ai_engine

    async def route_message(self, message):
        """Processes an incoming message, detecting intent and delegating to the feature."""
        user_id = str(message.user_id)
        text = message.text
        
        # 1. Retrieve session
        session = SessionManager.get_session(user_id)
        state = session.get("state", "IDLE")
        
        # 2. Check if we are already in an active flow (state machine)
        if state.startswith("booking_"):
            logger.info(f"User {user_id} is in active state {state}, routing to booking.")
            feature_class = get_feature("booking")
            return await feature_class().handle(message, session)
            
        if state.startswith("crm_"):
            logger.info(f"User {user_id} is in active state {state}, routing to crm.")
            feature_class = get_feature("crm")
            return await feature_class().handle(message, session)
        
        # 3. Detect Intent via AI layer if IDLE
        logger.info(f"Detecting intent for user {user_id} with text: {text}")
        
        # Load business-specific AI engine
        from ai import load_ai_provider
        ai_engine = load_ai_provider(getattr(message, "business_id", None)) or self.ai
        
        intent = await ai_engine.detect_intent(text)
        logger.info(f"Detected intent: {intent}")
        
        # 4. Route to designated feature
        feature_class = get_feature(intent)
        
        if not feature_class:
            logger.warning(f"No explicit feature found for intent '{intent}'. Falling back to FAQ.")
            feature_class = get_feature("faq")
            
        if feature_class:
            # FAQ Spam protection: if same user asks FAQ within 5 seconds, ignore or return mini-response
            import time
            if intent == "faq" or not get_feature(intent):
                last_faq = session.get("last_faq_time", 0)
                if time.time() - last_faq < 5:
                    logger.warning(f"FAQ Spam detected for user {user_id}. Silently dropping message.")
                    return None # Drop silently to break auto-responder loops
                session["last_faq_time"] = time.time()

            handler = feature_class()
            response = await handler.handle(message, session)
            return response
        else:
            return "I'm sorry, I cannot process this request at the moment."
