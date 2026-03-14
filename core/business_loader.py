from dataclasses import dataclass
from typing import Optional
from core.logger import get_logger

logger = get_logger()


@dataclass
class BusinessConfig:
    id: int
    name: str
    telegram_token: str
    # Resolved from ai_providers registry
    ai_provider: Optional[str]      # anthropic | openai | gemini
    ai_api_key: Optional[str]
    ai_model: Optional[str]
    # Business-level customisation
    ai_rules: Optional[str]
    assistant_type: str
    subscription_status: str


def _build_config(biz, provider) -> BusinessConfig:
    return BusinessConfig(
        id=biz.id,
        name=biz.name,
        telegram_token=biz.telegram_token or "",
        ai_provider=provider.provider if provider else None,
        ai_api_key=provider.api_key if provider else None,
        ai_model=provider.model if provider else None,
        ai_rules=biz.ai_rules,
        assistant_type=biz.assistant_type or "sales",
        subscription_status=biz.subscription_status or "inactive",
    )


def _load_provider(db, provider_id: Optional[int]):
    if not provider_id:
        logger.warning("Business has no ai_provider_id set — AI engine will be unavailable")
        return None
    from database.models import AIProvider
    p = db.query(AIProvider).filter(AIProvider.id == provider_id).first()
    if not p:
        logger.warning(f"AI provider id={provider_id} not found in ai_providers table")
        return None
    if not p.is_active:
        logger.warning(f"AI provider id={provider_id} ({p.name}) is inactive")
        return None
    logger.info(f"AI provider loaded: {p.name} ({p.provider}, model={p.model or 'default'})")
    return p


def load_business_by_token(db, token: str) -> Optional[BusinessConfig]:
    from database.models import Business
    biz = db.query(Business).filter(Business.telegram_token == token).first()
    if not biz:
        logger.warning(f"No business for token ...{token[-6:]}")
        return None
    provider = _load_provider(db, biz.ai_provider_id)
    return _build_config(biz, provider)


def load_business_by_connection_id(db, connection_id: str) -> Optional[BusinessConfig]:
    from database.models import Business
    biz = db.query(Business).filter(Business.business_connection_id == connection_id).first()
    if not biz:
        logger.warning(f"No business for connection_id {connection_id}")
        return None
    provider = _load_provider(db, biz.ai_provider_id)
    return _build_config(biz, provider)
