class BookingUI:
    @staticmethod
    def confirm_booking(slot):
        return f"Вы записаны:\nДата: {slot.get('date')}\nВремя: {slot.get('time')}\nПодтвердить?"
    
    @staticmethod
    def show_slots(slots):
        return "Доступные слоты:\n" + "\n".join([f"{s['date']} {s['time']}" for s in slots])
