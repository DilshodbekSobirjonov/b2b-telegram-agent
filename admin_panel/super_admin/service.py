from core.logger import get_logger

logger = get_logger()

class SuperAdminService:
    @staticmethod
    def add_business(name: str, telegram_token: str):
        logger.info(f"SuperAdmin: Adding new business {name}")
        # dummy implementation
        return f"Business {name} added."

    @staticmethod
    def disable_business(business_id: int):
        logger.info(f"SuperAdmin: Disabling business {business_id}")
        # dummy implementation
        return f"Business {business_id} disabled."
