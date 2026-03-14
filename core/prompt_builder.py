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


def build_system_prompt(business: BusinessConfig) -> str:
    """
    Assembles a two-layer system prompt:
      [PLATFORM RULES]  — global base + assistant type (same for every business)
      [BUSINESS RULES]  — per-business ai_rules from PostgreSQL (isolated per business)
    """
    assistant_type = (business.assistant_type or "sales").lower()
    type_prompt = _ASSISTANT_PROMPTS.get(assistant_type, _ASSISTANT_PROMPTS["sales"])

    platform_section = f"=== PLATFORM RULES ===\n{_PLATFORM_BASE}\n\n{type_prompt}"

    if business.ai_rules and business.ai_rules.strip():
        business_section = f"=== BUSINESS RULES ===\n{business.ai_rules.strip()}"
        return f"{platform_section}\n\n{business_section}"

    return platform_section
