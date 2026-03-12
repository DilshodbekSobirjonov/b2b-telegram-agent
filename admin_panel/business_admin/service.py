from core.logger import get_logger

logger = get_logger()

class BusinessAdminService:
    @staticmethod
    def add_service(business_id: int, service_name: str, duration: int, price: float):
        logger.info(f"BusinessAdmin: Adding service {service_name} for business {business_id}")
        return f"Service {service_name} created."

    @staticmethod
    def update_schedule(staff_id: int, schedule_data: dict):
        logger.info(f"BusinessAdmin: Updating schedule for staff {staff_id}")
        return "Schedule updated."

    @staticmethod
    def toggle_ai(business_id: int, enabled: bool):
        logger.info(f"BusinessAdmin: Toggled AI {'on' if enabled else 'off'} for business {business_id}")
        return f"AI is now {'enabled' if enabled else 'disabled'}."
