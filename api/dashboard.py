from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date

from database.repository import Repository
from database.models import Business, Appointment, Subscription, AIUsageLog, Conversation
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
        
        # Total revenue placeholder (would come from billing in real app)
        total_revenue = monthly_appointments * 50  # $50 per appointment estimate
        
        return {
            "totalRevenue": total_revenue,
            "activeBots": active_bots,
            "appointments": monthly_appointments,
            "aiEfficiency": 96.5,
            "totalBusinesses": total_businesses,
            "aiRequestsToday": ai_requests_today,
        }
    else:
        # Business Admin — scoped stats
        biz_id = current_user.business_id
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        today_bookings = (
            db.query(Appointment)
            .filter(Appointment.business_id == biz_id, Appointment.datetime >= today_start)
            .count()
        )
        
        # Unique clients via conversations
        unique_clients = (
            db.query(func.count(func.distinct(Conversation.user_id)))
            .filter(Conversation.business_id == biz_id)
            .scalar() or 0
        )
        
        return {
            "todayBookings": today_bookings,
            "freeSlots": 5,  # Computed from schedule in real implementation
            "totalClients": unique_clients,
            "weeklyGrowth": 12.4,
        }
