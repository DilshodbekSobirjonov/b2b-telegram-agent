from core.logger import get_logger

logger = get_logger()

class FeatureRegistry:
    def __init__(self):
        self._features = {}

    def register_feature(self, intent_name: str, handler_class):
        """Registers a handler class for a specific intent name."""
        self._features[intent_name] = handler_class
        logger.info(f"Registered feature '{intent_name}' with handler {handler_class.__name__}")

    def get_feature(self, intent_name: str):
        """Retrieves the handler class for a given intent."""
        handler = self._features.get(intent_name)
        if not handler:
            logger.warning(f"No feature registered for intent: '{intent_name}'")
        return handler

# Global registry instance
registry = FeatureRegistry()

def register_feature(intent_name: str, handler_class):
    registry.register_feature(intent_name, handler_class)

def get_feature(intent_name: str):
    return registry.get_feature(intent_name)
