from features.booking.logic import BookingLogic
from features.booking.ui import BookingUI
from core.logger import get_logger

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
                return BookingUI.confirm_booking(slot)
            else:
                return "К сожалению, свободных слотов нет."
                
        elif state == "booking_confirm":
            text = message.text.strip().lower()
            if text in ["да", "yes", "confirm", "подтвердить"]:
                session["state"] = "IDLE" # Reset state
                return "Отлично! Ваша запись подтверждена."
            elif text in ["нет", "no", "cancel", "отмена"]:
                session["state"] = "IDLE" # Reset state
                return "Отмена бронирования."
            else:
                return 'Пожалуйста, ответьте "Да" или "Нет" для подтверждения бронирования.'
                
        return "Неизвестная ошибка в бронировании. Начните заново."
