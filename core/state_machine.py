class StateMachine:
    """Simple state transition enforcement for user conversations."""
    
    @staticmethod
    def transition(session: dict, new_state: str):
        old_state = session.get("state", "IDLE")
        session["state"] = new_state
        return old_state, new_state
