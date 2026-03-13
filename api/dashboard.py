from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta

from database.repository import Repository
from database.models import Business, Appointment, Subscription, AIUsageLog, Conversation, MessageLog
from api.auth import get_current_user
from database.admin_users import AdminUser

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    if current_user.role == "SUPER_ADMIN":
        total_businesses = db.query(Business).count()
        
        # Active bots = businesses with active subscription
        active_bots = (
            db.query(Subscription)
            .filter(Subscription.status == "active")
            .count()
        )
        
        # Total appointments this month
        now = datetime.utcnow()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_appointments = (
            db.query(Appointment)
            .filter(Appointment.datetime >= month_start)
            .count()
        )
        
        # AI requests today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        ai_requests_today = (
            db.query(AIUsageLog)
            .filter(AIUsageLog.timestamp >= today_start)
            .count()
        )
        
        # Total revenue: $50 per completed appointment
        total_revenue = (
            db.query(Appointment)
            .filter(Appointment.status == "completed")
            .count()
        ) * 50
        
        # AI Efficiency calculation: percentage of messages that are bot-sent
        total_messages = db.query(MessageLog).count()
        bot_messages = db.query(MessageLog).filter(MessageLog.sender == "bot").count()
        ai_efficiency = (bot_messages / total_messages * 100) if total_messages > 0 else 100.0

        return {
            "totalRevenue": total_revenue,
            "activeBots": active_bots,
            "appointments": monthly_appointments,
            "aiEfficiency": round(ai_efficiency, 1),
            "totalBusinesses": total_businesses,
            "aiRequestsToday": ai_requests_today,
        }
    else:
        # Business Admin — scoped stats
        biz_id = current_user.business_id
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        today_bookings = (
            db.query(Appointment)
            .filter(
                Appointment.business_id == biz_id, 
                Appointment.datetime >= today_start,
                Appointment.datetime < today_start.replace(hour=23, minute=59)
            )
            .count()
        )
        
        # Free slots: total potential slots (8 hours * 2 slots/hour = 16) - booked today
        # In a full system this would use Schedule, but for MVP/Stats this is a good approximation
        free_slots = max(0, 16 - today_bookings)
        
        # Unique clients via conversations
        unique_clients = (
            db.query(func.count(func.distinct(Conversation.user_id)))
            .filter(Conversation.business_id == biz_id)
            .scalar() or 0
        )

        # Weekly growth: (this week - last week) / last week * 100
        last_week_start = today_start - timedelta(days=7)
        two_weeks_ago_start = last_week_start - timedelta(days=7)
        
        this_week_bookings = db.query(Appointment).filter(
            Appointment.business_id == biz_id,
            Appointment.datetime >= last_week_start
        ).count()
        
        last_week_bookings = db.query(Appointment).filter(
            Appointment.business_id == biz_id,
            Appointment.datetime >= two_weeks_ago_start,
            Appointment.datetime < last_week_start
        ).count()
        
        weekly_growth = 0.0
        if last_week_bookings > 0:
            weekly_growth = ((this_week_bookings - last_week_bookings) / last_week_bookings) * 100
        elif this_week_bookings > 0:
            weekly_growth = 100.0
        
        return {
            "todayBookings": today_bookings,
            "freeSlots": free_slots,
            "totalClients": unique_clients,
            "weeklyGrowth": round(weekly_growth, 1),
        }


@router.get("/chart")
def get_dashboard_chart(
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    data = []
    today = date.today()
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        q = db.query(Appointment).filter(
            Appointment.datetime >= day_start,
            Appointment.datetime <= day_end
        )
        if current_user.role == "BUSINESS_ADMIN":
            q = q.filter(Appointment.business_id == current_user.business_id)
        count = q.count()
        data.append({"date": day.strftime("%Y-%m-%d"), "bookings": count})
    return data
