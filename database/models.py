from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class AIProvider(Base):
    """Global registry of AI engines. Businesses reference these by ID."""
    __tablename__ = 'ai_providers'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    provider = Column(String, nullable=False)            # anthropic | openai | gemini
    api_key = Column(String, nullable=False)
    model = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)


class PlatformSetting(Base):
    """Global settings that apply across the entire platform."""
    __tablename__ = 'platform_settings'
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)


class Business(Base):
    __tablename__ = 'businesses'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    telegram_token = Column(String, unique=True, nullable=True)
    business_connection_id = Column(String, unique=True, nullable=True)
    ai_provider_id = Column(Integer, ForeignKey('ai_providers.id'), nullable=True)
    ai_rules = Column(Text, nullable=True)
    assistant_type = Column(String, default="sales")    # sales | booking
    subscription_status = Column(String, default="active")
    working_hours = Column(String, default="09:00-18:00")  # legacy display string
    timezone = Column(String, default="UTC")
    # Booking mode config
    slot_duration = Column(Integer, default=30)            # minutes per slot
    min_booking_duration = Column(Integer, default=30)     # minimum bookable duration
    max_booking_duration = Column(Integer, default=120)    # maximum bookable duration
    buffer_after = Column(Integer, default=0)              # minutes buffer after booking


class BusinessClosedDay(Base):
    """Full-day closures / holidays."""
    __tablename__ = 'business_closed_days'
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey('businesses.id', ondelete='CASCADE'), nullable=False)
    date = Column(DateTime, nullable=False)
    reason = Column(String, nullable=True)


class WorkingHours(Base):
    """One row per business — authoritative working hours for slot generation."""
    __tablename__ = 'working_hours'
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey('businesses.id', ondelete='CASCADE'), nullable=False, unique=True)
    start_time = Column(String(5), nullable=False, default='09:00')  # "HH:MM"
    end_time = Column(String(5), nullable=False, default='18:00')    # "HH:MM"


class BusinessBreak(Base):
    """Break periods during working hours (e.g. lunch). Multiple per business."""
    __tablename__ = 'business_breaks'
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey('businesses.id', ondelete='CASCADE'), nullable=False)
    start_time = Column(String(5), nullable=False)   # "HH:MM"
    end_time = Column(String(5), nullable=False)     # "HH:MM"
    label = Column(String, nullable=True)            # e.g. "Lunch"


class Product(Base):
    """Sales mode inventory item."""
    __tablename__ = 'products'
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey('businesses.id', ondelete='CASCADE'), nullable=False)
    name = Column(String, nullable=False)
    price = Column(Float, default=0.0)
    quantity = Column(Integer, default=0)
    category = Column(String, nullable=True)
    discount = Column(Float, default=0.0)            # percentage
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, nullable=True)


class Sale(Base):
    """Sales mode transaction record."""
    __tablename__ = 'sales'
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey('businesses.id', ondelete='CASCADE'), nullable=False)
    customer_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    product_id = Column(Integer, ForeignKey('products.id', ondelete='SET NULL'), nullable=True)
    quantity = Column(Integer, default=1)
    price = Column(Float, nullable=True)             # unit price at time of sale
    discount = Column(Float, default=0.0)            # percentage discount applied
    final_price = Column(Float, nullable=True)       # total after discount × qty
    created_at = Column(DateTime, nullable=True)


class Service(Base):
    __tablename__ = 'services'
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey('businesses.id'))
    name = Column(String, nullable=False)
    duration = Column(Integer)  # minutes
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
    day_of_week = Column(Integer)
    start_time = Column(String)
    end_time = Column(String)


class Appointment(Base):
    __tablename__ = 'appointments'
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey('businesses.id'))
    user_id = Column(String, index=True, nullable=True)
    service_id = Column(Integer, ForeignKey('services.id'), nullable=True)
    staff_id = Column(Integer, ForeignKey('staff.id'), nullable=True)
    datetime = Column(DateTime)              # start time
    duration = Column(Integer, default=30)   # minutes
    status = Column(String, default='pending')  # pending|confirmed|completed|cancelled
    customer_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=True)


class UserSession(Base):
    __tablename__ = 'user_sessions'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True)
    state = Column(String)
    context_data = Column(JSON, nullable=True)


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
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)
    business_id = Column(Integer, ForeignKey('businesses.id'))
    start_time = Column(DateTime)
    end_time = Column(DateTime, nullable=True)


class MessageLog(Base):
    __tablename__ = 'message_logs'
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(String, ForeignKey('conversations.id'))
    sender = Column(String)
    text = Column(Text)
    timestamp = Column(DateTime)


class AIUsageLog(Base):
    __tablename__ = 'ai_usage_logs'
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(String, ForeignKey('conversations.id'))
    provider = Column(String)
    tokens_used = Column(Integer)
    timestamp = Column(DateTime)
