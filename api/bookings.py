from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime

from database.repository import Repository
from database.models import Appointment, Service, Staff
from api.auth import get_current_user
from database.admin_users import AdminUser

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])


def serialize_appointment(appt: Appointment, db: Session) -> dict:
    service = db.query(Service).filter(Service.id == appt.service_id).first()
    staff = db.query(Staff).filter(Staff.id == appt.staff_id).first()
    return {
        "id": appt.user_id,
        "clientName": f"Client #{str(appt.user_id)[:8]}",  # Real name would come from CRM
        "date": appt.datetime.strftime("%Y-%m-%d") if appt.datetime else None,
        "time": appt.datetime.strftime("%H:%M") if appt.datetime else None,
        "service": service.name if service else "Unknown",
        "staff": staff.name if staff else "Unknown",
        "status": appt.status or "confirmed",
        "businessId": appt.business_id,
    }


@router.get("")
def list_bookings(
    business_id: int = Query(None),
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    q = db.query(Appointment)
    if current_user.role == "BUSINESS_ADMIN":
        q = q.filter(Appointment.business_id == current_user.business_id)
    elif business_id:
        q = q.filter(Appointment.business_id == business_id)
    appts = q.order_by(Appointment.datetime.desc()).limit(100).all()
    return [serialize_appointment(a, db) for a in appts]


@router.get("/recent")
def recent_bookings(
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    q = db.query(Appointment)
    if current_user.role == "BUSINESS_ADMIN":
        q = q.filter(Appointment.business_id == current_user.business_id)
    appts = q.order_by(Appointment.datetime.desc()).limit(5).all()
    return [serialize_appointment(a, db) for a in appts]


@router.get("/today")
def today_bookings(
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start.replace(hour=23, minute=59, second=59)
    q = db.query(Appointment).filter(
        Appointment.datetime >= today_start,
        Appointment.datetime <= today_end
    )
    if current_user.role == "BUSINESS_ADMIN":
        q = q.filter(Appointment.business_id == current_user.business_id)
    appts = q.order_by(Appointment.datetime).all()
    return [serialize_appointment(a, db) for a in appts]
