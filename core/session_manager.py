from core.logger import get_logger
import json

logger = get_logger()

# In-memory fallback for now. Should be replaced with Redis/DB in production
_sessions = {}

class SessionManager:
    """Manages active user sessions, state, and context across the platform."""
    
    @staticmethod
    def get_session(user_id: str) -> dict:
        if user_id not in _sessions:
            logger.debug(f"Created new session for user {user_id}")
            _sessions[user_id] = {
                "state": "IDLE",
                "context": {},
                "business_id": None
            }
        return _sessions[user_id]

    @staticmethod
    def update_session(user_id: str, new_data: dict):
        session = SessionManager.get_session(user_id)
        session.update(new_data)
        _sessions[user_id] = session
        logger.debug(f"Updated session for user {user_id}: {json.dumps(new_data)}")

    @staticmethod
    def clear_session(user_id: str):
        if user_id in _sessions:
            del _sessions[user_id]
            logger.debug(f"Cleared session for user {user_id}")
