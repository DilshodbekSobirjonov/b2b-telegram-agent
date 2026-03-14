from typing import Dict, Optional
from aiogram import Bot
from core.logger import get_logger

logger = get_logger()


class BotRegistry:
    """
    Singleton registry of active Bot instances keyed by token.
    All webhook sending and lifecycle management goes through here.
    """

    def __init__(self):
        self._bots: Dict[str, Bot] = {}

    def register(self, token: str) -> Bot:
        if token not in self._bots:
            self._bots[token] = Bot(token=token)
            logger.debug(f"Registered bot token ...{token[-6:]}")
        return self._bots[token]

    def get(self, token: str) -> Optional[Bot]:
        return self._bots.get(token)

    def all_tokens(self) -> list[str]:
        return list(self._bots.keys())

    def all_bots(self) -> list[Bot]:
        return list(self._bots.values())

    async def close_all(self):
        for bot in self._bots.values():
            await bot.session.close()
        self._bots.clear()
        logger.info("All bot sessions closed.")


# Module-level singleton — imported everywhere
registry = BotRegistry()
