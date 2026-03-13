from features.booking.logic import BookingLogic
from features.booking.ui import BookingUI
from core.logger import get_logger
from database.repository import Repository
from database.models import Appointment

logger = get_logger()

class BookingHandler:
    async def handle(self, message, session):
        logger.info(f"Handling booking request for user {message.user_id}")
        
        state = session.get("state", "IDLE")
        
        if state == "IDLE":
            # Initial intent detected
            slot = BookingLogic.find_available_slot(session)
            if slot:
                # Move to confirmation state
                session["state"] = "booking_confirm"
                session["pending_booking_datetime"] = slot["datetime_obj"].isoformat()
                return BookingUI.confirm_booking(slot)
            else:
                return "К сожалению, свободных слотов нет."
                
        elif state == "booking_confirm":
            text = message.text.strip().lower()
            if text in ["да", "yes", "confirm", "подтвердить"]:
                session["state"] = "IDLE" # Reset state
                
                # Save to database
                pending_dt_str = session.get("pending_booking_datetime")
                if pending_dt_str:
                    import datetime
                    pending_dt = datetime.datetime.fromisoformat(pending_dt_str)
                    db = next(Repository.get_db())
                    
                    new_appt = Appointment(
                        business_id=session.get("business_id"),
                        user_id=message.user_id,
                        datetime=pending_dt,
                        status="confirmed"
                    )
                    db.add(new_appt)
                    db.commit()
                    
                return "Отлично! Ваша запись подтверждена."
            elif text in ["нет", "no", "cancel", "отмена"]:
                session["state"] = "IDLE" # Reset state
                return "Отмена бронирования."
            else:
                return 'Пожалуйста, ответьте "Да" или "Нет" для подтверждения бронирования.'
                
        return "Неизвестная ошибка в бронировании. Начните заново."
