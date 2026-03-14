import datetime
from core.logger import get_logger
from database.repository import Repository
from database.models import Business, Appointment

logger = get_logger()

class BookingLogic:
    @staticmethod
    async def extract_requested_time(message):
        """Uses AI to extract requested date and time from user message."""
        if not hasattr(message, "ai_engine") or not message.ai_engine:
            return None
            
        prompt = (
            "Extract the requested booking date and time from the user message. "
            "Return exactly in format 'YYYY-MM-DD HH:MM'. "
            "If only time is mentioned, assume it is for TODAY. "
            "If only date is mentioned, assume 09:00. "
            "If no date/time found, return 'NONE'.\n"
            f"User message: {message.text}"
        )
        
        try:
            res = await message.ai_engine.generate_reply({"system": "You are a data extractor."}, prompt)
            res = res.strip().upper()
            if res == "NONE":
                return None
            return res
        except Exception as e:
            logger.error(f"Time extraction failed: {e}")
            return None

    @staticmethod
    def is_slot_available(business_id, dt_obj):
        """Check if a specific slot is actually available in the DB."""
        from database.repository import Repository
        from database.models import Business, Appointment, WorkingHours, BusinessBreak, BusinessClosedDay
        from booking.slots import generate_available_slots
        
        db = next(Repository.get_db())
        biz = db.query(Business).filter(Business.id == business_id).first()
        wh = db.query(WorkingHours).filter(WorkingHours.business_id == business_id).first()
        if not biz or not wh:
            return False
            
        target_date = dt_obj.date()
        day_start = datetime.datetime.combine(target_date, datetime.time.min)
        day_end = datetime.datetime.combine(target_date, datetime.time.max)
        
        appts = db.query(Appointment).filter(
            Appointment.business_id == business_id,
            Appointment.datetime >= day_start,
            Appointment.datetime <= day_end,
            Appointment.status != "cancelled"
        ).all()
        booked = [(a.datetime, a.duration or 30) for a in appts]
        
        breaks_raw = db.query(BusinessBreak).filter(BusinessBreak.business_id == business_id).all()
        breaks = [(b.start_time, b.end_time) for b in breaks_raw]
        
        closed_days_raw = db.query(BusinessClosedDay).filter(BusinessClosedDay.business_id == business_id).all()
        closed_days = [cd.date.date() for cd in closed_days_raw]

        slots = generate_available_slots(
            target_date=target_date,
            work_start=wh.start_time,
            work_end=wh.end_time,
            slot_duration=biz.slot_duration or 30,
            booked=booked,
            breaks=breaks,
            buffer_after=biz.buffer_after or 0,
            closed_days=closed_days
        )
        
        return dt_obj.strftime("%H:%M") in slots
