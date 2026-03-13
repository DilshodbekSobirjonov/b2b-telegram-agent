import datetime
from core.logger import get_logger
from database.repository import Repository
from database.models import Business, Appointment

logger = get_logger()

class BookingLogic:
    @staticmethod
    def find_available_slot(session):
        logger.debug("Finding available slot from db based on business working hours...")
        
        business_id = session.get("business_id")
        if not business_id:
            logger.error("No business_id found in session for booking.")
            return None
            
        db = next(Repository.get_db())
        business = db.query(Business).filter(Business.id == business_id).first()
        if not business:
            return None
            
        # Parse working hours (e.g., "09:00-18:00")
        working_hours = business.working_hours or "09:00-18:00"
        try:
            start_str, end_str = working_hours.split('-')
            start_hour = int(start_str.split(':')[0])
        except Exception:
            start_hour = 9 # Fallback
            
        # For MVP, just propose tomorrow at the start hour
        tomorrow = datetime.datetime.now() + datetime.timedelta(days=1)
        proposed_time = datetime.time(hour=start_hour, minute=0)
        proposed_datetime = datetime.datetime.combine(tomorrow.date(), proposed_time)
        
        return {
            "date": proposed_datetime.strftime("%Y-%m-%d"), 
            "time": proposed_datetime.strftime("%H:%M"),
            "datetime_obj": proposed_datetime
        }
