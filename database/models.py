from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Business(Base):
    __tablename__ = 'businesses'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    telegram_token = Column(String, unique=True, nullable=True)
    business_connection_id = Column(String, unique=True, nullable=True)
    ai_provider = Column(String, default="anthropic")
    subscription_status = Column(String, default="active")


class Service(Base):
    __tablename__ = 'services'
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey('businesses.id'))
    name = Column(String, nullable=False)
    duration = Column(Integer) # in minutes
    price = Column(Float)

class Staff(Base):
    __tablename__ = 'staff'
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey('businesses.id'))
    name = Column(String, nullable=False)
    bio = Column(Text)

class Schedule(Base):
    __tablename__ = 'schedules'
    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey('staff.id'))
    day_of_week = Column(Integer) # 0-6
    start_time = Column(String) # "HH:MM"
    end_time = Column(String) # "HH:MM"

class Appointment(Base):
    __tablename__ = 'appointments'
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey('businesses.id'))
    user_id = Column(String, index=True)
    service_id = Column(Integer, ForeignKey('services.id'))
    staff_id = Column(Integer, ForeignKey('staff.id'))
    datetime = Column(DateTime)
    status = Column(String)

class UserSession(Base):
    __tablename__ = 'user_sessions'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True)
    state = Column(String)
    context_data = Column(Text) # JSON string

class Subscription(Base):
    __tablename__ = 'subscriptions'
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey('businesses.id'))
    plan = Column(String)
    expire_date = Column(DateTime)
    status = Column(String)

class BusinessFeature(Base):
    __tablename__ = 'business_features'
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey('businesses.id'))
    feature_name = Column(String)
    is_enabled = Column(Boolean, default=True)

class Conversation(Base):
    __tablename__ = 'conversations'
    id = Column(String, primary_key=True, index=True) # UUID
    user_id = Column(String, index=True)
    business_id = Column(Integer, ForeignKey('businesses.id'))
    start_time = Column(DateTime)
    end_time = Column(DateTime, nullable=True)

class MessageLog(Base):
    __tablename__ = 'message_logs'
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(String, ForeignKey('conversations.id'))
    sender = Column(String) # 'user' or 'bot'
    text = Column(Text)
    timestamp = Column(DateTime)

class AIUsageLog(Base):
    __tablename__ = 'ai_usage_logs'
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(String, ForeignKey('conversations.id'))
    provider = Column(String)
    tokens_used = Column(Integer)
    timestamp = Column(DateTime)

class AIProvider(Base):
    __tablename__ = 'ai_providers'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False) # e.g., 'anthropic', 'openai'
    api_key = Column(String, nullable=False)
    base_url = Column(String, nullable=True)
    model_name = Column(String, nullable=True) # default model for this provider
    is_active = Column(Boolean, default=True)
