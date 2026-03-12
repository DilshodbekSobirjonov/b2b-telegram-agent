from features.booking.logic import BookingLogic
from features.booking.ui import BookingUI
from core.logger import get_logger

logger = get_logger()

class BookingHandler:
    async def handle(self, message, session):
        logger.info(f"Handling booking request for user {message.user_id}")
        
        # In a real app, logic would use extracted entities from AI
        slot = BookingLogic.find_available_slot(session)
        
        if slot:
            return BookingUI.confirm_booking(slot)
        else:
            return "К сожалению, свободных слотов нет."
