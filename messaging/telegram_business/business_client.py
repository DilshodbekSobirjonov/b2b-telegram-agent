from core.logger import get_logger

logger = get_logger()


class TelegramBusinessClient:
    """
    Sends messages via Telegram Business API.
    Uses the bot that received the original business message (identified by bot_token).
    """

    def __init__(self, registry):
        self.registry = registry

    async def send_message(
        self,
        bot_token: str,
        user_id: str,
        text: str,
        business_connection_id: str,
    ):
        bot = self.registry.get(bot_token)
        if not bot:
            logger.error(f"send_business_message: bot token ...{bot_token[-6:]} not in registry")
            return
        try:
            await bot.send_message(
                chat_id=int(user_id),
                text=text,
                business_connection_id=business_connection_id,
            )
        except Exception as e:
            logger.error(f"send_business_message failed for user {user_id}: {e}")
