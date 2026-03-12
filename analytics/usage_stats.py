from core.logger import get_logger

logger = get_logger()

class UsageStats:
    @staticmethod
    def calculate_token_usage(business_id: int, start_date: str, end_date: str):
        logger.info(f"Analytics: Calculating token usage for {business_id} from {start_date} to {end_date}")
        # In a real environment, query `AIUsageLog` grouping by `provider`.
        return {"anthropic": 15400, "openai": 0}
