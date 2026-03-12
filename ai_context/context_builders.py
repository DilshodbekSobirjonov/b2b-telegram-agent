class SystemContext:
    @staticmethod
    def get_context():
        return "You are a helpful B2B assistant."

class BusinessContext:
    @staticmethod
    def get_context(business_id):
        # mock db call
        return "Company Name: Example Inc. Rules: Be polite."

class ConversationContext:
    @staticmethod
    def get_context(session):
        return f"Previous state: {session.get('state')}"
