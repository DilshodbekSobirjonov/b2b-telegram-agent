from core.logger import get_logger

logger = get_logger()

class BookingAnalytics:
    @staticmethod
    def get_bookings_per_day(business_id: int):
        logger.info(f"Analytics: Calculating bookings per day for business {business_id}")
        return {"monday": 5, "tuesday": 12, "wednesday": 8}

    @staticmethod
    def get_staff_utilization(business_id: int):
        logger.info(f"Analytics: Calculating staff utilization for business {business_id}")
        return {"staff_1": "85%", "staff_2": "60%"}

    @staticmethod
    def get_returning_clients(business_id: int):
        logger.info(f"Analytics: Calculating returning clients for business {business_id}")
        return {"new": 10, "returning": 45}
