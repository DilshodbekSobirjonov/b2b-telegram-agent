from core.business_loader import BusinessConfig

_PLATFORM_BASE = (
    "You are a smart AI assistant for a B2B company. "
    "Be professional, concise, and helpful. "
    "Always respond in the same language the client uses."
)

_ASSISTANT_PROMPTS = {
    "sales": (
        "Your role is sales consultant. Help clients understand the product offering, "
        "answer pricing and feature questions, and guide them towards a purchase decision. "
        "Be persuasive but never pushy."
    ),
    "booking": (
        "Your role is booking assistant. Help clients schedule appointments, "
        "check availability, and manage their bookings. "
        "Be clear about available times and confirmation steps."
    ),
}


def build_system_prompt(business: BusinessConfig, db_session) -> str:
    """
    Assembles a two-layer system prompt:
      [PLATFORM RULES]  — global base from DB + assistant type (same for every business)
      [AVAILABILITY]    — (Optional) current real-time slot info for booking bots
      [BUSINESS RULES]  — per-business ai_rules from PostgreSQL (isolated per business)
    """
    from database.models import PlatformSetting, Appointment, Business, WorkingHours, BusinessBreak, BusinessClosedDay
    from datetime import datetime, date, timedelta
    from booking.slots import generate_available_slots

    # Fetch global rules from DB
    global_rules_setting = db_session.query(PlatformSetting).filter(PlatformSetting.key == "global_ai_rules").first()
    
    # Fallback to hardcoded if not set in DB
    global_base = global_rules_setting.value if global_rules_setting and global_rules_setting.value else _PLATFORM_BASE

    assistant_type = (business.assistant_type or "sales").lower()
    type_prompt = _ASSISTANT_PROMPTS.get(assistant_type, _ASSISTANT_PROMPTS["sales"])

    platform_section = f"=== PLATFORM RULES ===\n{global_base.strip()}\n\n{type_prompt}"
    
    availability_section = ""
    if assistant_type == "booking":
        # Generate context for today and tomorrow
        biz_id = business.id
        wh = db_session.query(WorkingHours).filter(WorkingHours.business_id == biz_id).first()
        if wh:
            avail_parts = []
            for i in range(2): # Today and tomorrow
                target_date = date.today() + timedelta(days=i)
                day_label = "TODAY" if i == 0 else "TOMORROW"
                
                # Load context
                day_start = datetime.combine(target_date, datetime.min.time())
                day_end = datetime.combine(target_date, datetime.max.time())
                
                appts = db_session.query(Appointment).filter(
                    Appointment.business_id == biz_id,
                    Appointment.datetime >= day_start,
                    Appointment.datetime <= day_end,
                    Appointment.status != "cancelled"
                ).all()
                booked = [(a.datetime, a.duration or 30) for a in appts]
                
                breaks_raw = db_session.query(BusinessBreak).filter(BusinessBreak.business_id == biz_id).all()
                breaks = [(b.start_time, b.end_time) for b in breaks_raw]
                
                closed_days_raw = db_session.query(BusinessClosedDay).filter(BusinessClosedDay.business_id == biz_id).all()
                closed_days = [cd.date.date() for cd in closed_days_raw]

                db_business = db_session.query(Business).filter(Business.id == biz_id).first()
                slot_duration = db_business.slot_duration or 30
                buffer_after = db_business.buffer_after or 0

                slots = generate_available_slots(
                    target_date=target_date,
                    work_start=wh.start_time,
                    work_end=wh.end_time,
                    slot_duration=slot_duration,
                    booked=booked,
                    breaks=breaks,
                    buffer_after=buffer_after,
                    closed_days=closed_days
                )
                
                date_str = target_date.strftime("%Y-%m-%d")
                if slots:
                    avail_parts.append(f"{day_label} ({date_str}) AVAILABLE SLOTS: {', '.join(slots)}")
                else:
                    avail_parts.append(f"{day_label} ({date_str}) NO SLOTS AVAILABLE.")

            availability_section = f"=== REAL-TIME AVAILABILITY ===\n" + "\n".join(avail_parts) + \
                                   "\n\nIMPORTANT: Do NOT invent booking times. Only confirm times listed above. " + \
                                   "If a user asks for a busy time, suggest the nearest available slots."

    full_prompt = platform_section
    if availability_section:
        full_prompt += f"\n\n{availability_section}"

    if business.ai_rules and business.ai_rules.strip():
        business_section = f"=== BUSINESS RULES ===\n{business.ai_rules.strip()}"
        full_prompt += f"\n\n{business_section}"

    return full_prompt
