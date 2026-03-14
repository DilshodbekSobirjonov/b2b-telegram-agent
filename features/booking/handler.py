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
        business_id = session.get("business_id")
        
        if state == "IDLE":
            # 1. Try to extract time from message
            extracted = await BookingLogic.extract_requested_time(message)
            if extracted:
                import datetime
                try:
                    dt_obj = datetime.datetime.strptime(extracted, "%Y-%m-%d %H:%M")
                    if BookingLogic.is_slot_available(business_id, dt_obj):
                        # Move to confirmation state
                        session["state"] = "booking_confirm"
                        session["pending_booking_datetime"] = dt_obj.isoformat()
                        
                        instruction = f"The user wants to book an appointment for {extracted}. This slot is AVAILABLE. Confirm this with user and ask for confirmation."
                        return await message.ai_engine.generate_reply({"system": message.system_prompt + "\n" + instruction}, message.text)
                    else:
                        instruction = f"The user wants to book for {extracted}, but this slot is BUSY or outside working hours. Suggest available slots from the list above instead."
                        return await message.ai_engine.generate_reply({"system": message.system_prompt + "\n" + instruction}, message.text)
                except Exception as e:
                    logger.error(f"Error parsing extracted time: {e}")

            # 2. No specific time or extraction failed - let AI suggest times
            instruction = "The user is interested in a booking. Look at the REAL-TIME AVAILABILITY in your system prompt and suggest some available times to the user."
            return await message.ai_engine.generate_reply({"system": message.system_prompt + "\n" + instruction}, message.text)
                
        elif state == "booking_confirm":
            # Use AI to detect confirmation intent (Yes/No)
            prompt = f"Does the user confirm the booking in this message? Reply only 'YES' or 'NO' or 'CANCEL' or 'CHANGE'.\nUser message: {message.text}"
            res = await message.ai_engine.generate_reply({"system": "You are an intent detector."}, prompt)
            intent = res.strip().upper()

            if "YES" in intent:
                session["state"] = "IDLE"
                pending_dt_str = session.get("pending_booking_datetime")
                if pending_dt_str:
                    import datetime
                    pending_dt = datetime.datetime.fromisoformat(pending_dt_str)
                    db = next(Repository.get_db())
                    new_appt = Appointment(
                        business_id=business_id,
                        user_id=message.user_id,
                        datetime=pending_dt,
                        status="confirmed",
                        created_at=datetime.datetime.utcnow()
                    )
                    db.add(new_appt)
                    db.commit()
                    instruction = f"The booking for {pending_dt.strftime('%Y-%m-%d %H:%M')} is successfully CONFIRMED and SAVED to the database. Tell the user it's all set."
                    return await message.ai_engine.generate_reply({"system": message.system_prompt + "\n" + instruction}, message.text)

            elif "NO" in intent or "CANCEL" in intent:
                session["state"] = "IDLE"
                instruction = "The user canceled the booking. Acknowledge this politely."
                return await message.ai_engine.generate_reply({"system": message.system_prompt + "\n" + instruction}, message.text)
            
            elif "CHANGE" in intent:
                session["state"] = "IDLE"
                return await self.handle(message, session) # Recurse to IDLE logic

            else:
                instruction = "The user is in the confirmation step for a booking. They haven't given a clear Yes/No/Cancel. Ask them to confirm if they want the listed time or suggest a different one."
                return await message.ai_engine.generate_reply({"system": message.system_prompt + "\n" + instruction}, message.text)
                
        return await message.ai_engine.generate_reply({"system": message.system_prompt}, message.text)
