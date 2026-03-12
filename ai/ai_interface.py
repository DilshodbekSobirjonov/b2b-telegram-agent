from abc import ABC, abstractmethod

class AIInterface(ABC):
    """Abstract Base Class for all AI providers."""
    
    @abstractmethod
    async def detect_intent(self, text: str) -> str:
        """Analyzes text and returns a registered intent string."""
        pass

    @abstractmethod
    async def generate_reply(self, context: dict, prompt: str) -> str:
        """Generates a reply based on conversation context and current prompt."""
        pass
