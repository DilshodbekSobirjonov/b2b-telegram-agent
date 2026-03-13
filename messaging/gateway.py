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
        user_id = str(message.from_user.id)
        connection_id = getattr(message, "business_connection_id", None)
        
        # Identify Business ID
        from database.repository import Repository
        from database.models import Business
        db = next(Repository.get_db())
        
        business_id = None
        if connection_id:
            biz = db.query(Business).filter(Business.business_connection_id == connection_id).first()
            if biz:
                business_id = biz.id
        else:
            # Fallback for standard bot: find business by bot token
            # We can get the bot token from self.bot_client.token
            token = self.bot_client.token
            biz = db.query(Business).filter(Business.telegram_token == token).first()
            if biz:
                business_id = biz.id

        logger.debug(f"Gateway received message from User {user_id} (Connection: {connection_id}, Business: {business_id}): {message.text}")
        
        # Custom object to match what the Router expects
        class NormalizedMessage:
            def __init__(self, user_id, text, business_id=None, business_connection_id=None):
                self.user_id = user_id
                self.text = text
                self.business_id = business_id
                self.business_connection_id = business_connection_id
                
        normalized = NormalizedMessage(
            user_id=user_id,
            text=message.text or "",
            business_id=business_id,
            business_connection_id=connection_id
        )
        
        # Send through core router
        response_text = await self.router.route_message(normalized)
        
        # Route back to user
        if normalized.business_connection_id:
            await self.business_client.send_message(
                normalized.user_id, 
                response_text, 
                normalized.business_connection_id
            )
        else:
            await self.bot_client.send_message(normalized.user_id, response_text)

