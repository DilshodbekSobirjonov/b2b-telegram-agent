from core.logger import get_logger

logger = get_logger()

class MessagingGateway:
    """Entrypoint and decision maker for incoming messages."""
    
    def __init__(self, bot_client, business_client, router):
        self.bot_client = bot_client
        self.business_client = business_client
        self.router = router

    async def handle_incoming(self, message):
        """Determines transport and passes standard message to the Router."""
        logger.debug(f"Gateway received message from User {message.from_user.id}: {message.text}")
        
        # In this MVP, we treat the aiogram Message object as the normalized standard
        # A full business implementation would check `message.business_connection_id`
        is_business = getattr(message, "business_connection_id", None) is not None
        
        # Custom object to match what the Router expects
        class NormalizedMessage:
            def __init__(self, user_id, text):
                self.user_id = user_id
                self.text = text
                
        normalized = NormalizedMessage(
            user_id=str(message.from_user.id),
            text=message.text or ""
        )
        
        # Send through core router
        response_text = await self.router.route_message(normalized)
        
        # Route back to user
        if is_business:
            await self.business_client.send_message(normalized.user_id, response_text, message.business_connection_id)
        else:
            await self.bot_client.send_message(normalized.user_id, response_text)
