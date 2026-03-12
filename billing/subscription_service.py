from datetime import datetime
from core.logger import get_logger

logger = get_logger()

class SubscriptionService:
    @staticmethod
    def check_access(business_id: int) -> bool:
        """Verifies if the business has an active subscription."""
        logger.debug(f"Checking subscription for business {business_id}")
        # Mock implementation: allow all for now.
        # Real implementation would query the `subscriptions` table.
        return True

    @staticmethod
    def disable_features(business_id: int):
        """Called by a cron job or webhook when a subscription expires."""
        logger.warning(f"Disabling premium features for unpaid business {business_id}")
        # Toggle off features in database
