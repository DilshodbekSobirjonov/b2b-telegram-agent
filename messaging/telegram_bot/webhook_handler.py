from core.logger import get_logger

logger = get_logger()

class WebhookHandler:
    """Receives HTTP webhook POSTs from Telegram and passes them to the Gateway."""
    
    def __init__(self, gateway):
        self.gateway = gateway
        
    async def process_webhook(self, request_payload: dict):
        logger.debug("Received webhook payload")
        await self.gateway.handle_incoming(request_payload)
