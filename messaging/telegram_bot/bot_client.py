from core.logger import get_logger

logger = get_logger()


class WebhookBotClient:
    """
    Sends messages back to users via the bot registry.
    No polling, no Dispatcher — updates arrive via POST /webhook/{token}.
    """

    def __init__(self, registry):
        self.registry = registry

    async def send_message(self, bot_token: str, user_id: str, text: str):
        bot = self.registry.get(bot_token)
        if not bot:
            logger.error(f"send_message: bot token ...{bot_token[-6:]} not in registry")
            return
        try:
            await bot.send_message(chat_id=int(user_id), text=text)
        except Exception as e:
            logger.error(f"send_message failed for user {user_id}: {e}")
