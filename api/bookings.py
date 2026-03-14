"""
Booking API — appointments, slot generation, working-hours config, break config.

Endpoints:
  GET  /api/bookings              — list appointments
  POST /api/bookings              — create appointment
  PATCH /api/bookings/{id}        — update appointment status
  DELETE /api/bookings/{id}       — cancel appointment

  GET  /api/bookings/slots        — available slots for a date
  GET  /api/bookings/today        — today's appointments (dashboard compat)
  GET  /api/bookings/recent       — 5 most recent (dashboard compat)

  GET  /api/bookings/config       — working hours + breaks + slot settings
  PUT  /api/bookings/config       — update slot_duration / min / max
  PUT  /api/bookings/config/hours — set working hours (start/end)
  POST /api/bookings/config/breaks — add a break period
  DELETE /api/bookings/config/breaks/{break_id} — remove a break period
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

from database.repository import Repository
from database.models import Appointment, Business, WorkingHours, BusinessBreak
from api.auth import get_current_user
from database.admin_users import AdminUser
from booking.slots import generate_available_slots, get_allowed_durations, format_duration

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _biz_id(current_user: AdminUser, business_id: Optional[int] = None) -> int:
    if current_user.role == "SUPER_ADMIN":
        if not business_id:
            raise HTTPException(400, "business_id query param required for super admin")
        return business_id
    if not current_user.business_id:
        raise HTTPException(403, "No business linked to this account")
    return current_user.business_id


def _get_business(db, biz_id: int) -> Business:
    biz = db.query(Business).filter(Business.id == biz_id).first()
    if not biz:
        raise HTTPException(404, "Business not found")
    return biz


def _get_or_create_working_hours(db, biz_id: int, biz: Business) -> WorkingHours:
    wh = db.query(WorkingHours).filter(WorkingHours.business_id == biz_id).first()
    if not wh:
        # Bootstrap from the legacy string field
        start, end = "09:00", "18:00"
        if biz.working_hours and "-" in biz.working_hours:
            parts = biz.working_hours.split("-")
            if len(parts) == 2:
                start, end = parts[0].strip(), parts[1].strip()
        wh = WorkingHours(business_id=biz_id, start_time=start, end_time=end)
        db.add(wh)
        db.commit()
        db.refresh(wh)
    return wh


def _serialize_appointment(a: Appointment) -> dict:
    return {
        "id": a.id,
        "customer_name": a.customer_name,
        "phone": a.phone,
        "start_time": a.datetime.strftime("%H:%M") if a.datetime else None,
        "date": a.datetime.strftime("%Y-%m-%d") if a.datetime else None,
        "duration": a.duration or 30,
        "status": a.status or "pending",
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


# ── Pydantic models ───────────────────────────────────────────────────────────

class AppointmentCreate(BaseModel):
    customer_name: str
    phone: Optional[str] = None
    date: str          # "YYYY-MM-DD"
    start_time: str    # "HH:MM"
    duration: int = 30


class AppointmentStatusUpdate(BaseModel):
    status: str  # pending | confirmed | completed | cancelled


class SlotConfigUpdate(BaseModel):
    slot_duration: Optional[int] = None
    min_booking_duration: Optional[int] = None
    max_booking_duration: Optional[int] = None


class WorkingHoursUpdate(BaseModel):
    start_time: str  # "HH:MM"
    end_time: str    # "HH:MM"


class BreakCreate(BaseModel):
    start_time: str   # "HH:MM"
    end_time: str     # "HH:MM"
    label: Optional[str] = None


# ── Appointment endpoints ─────────────────────────────────────────────────────

@router.get("")
def list_appointments(
    business_id: Optional[int] = Query(None),
    date_filter: Optional[str] = Query(None, alias="date"),
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    biz_id = _biz_id(current_user, business_id)
    q = db.query(Appointment).filter(Appointment.business_id == biz_id)

    if date_filter:
        try:
            d = datetime.strptime(date_filter, "%Y-%m-%d")
            day_start = d.replace(hour=0, minute=0, second=0)
            day_end   = d.replace(hour=23, minute=59, second=59)
            q = q.filter(Appointment.datetime >= day_start, Appointment.datetime <= day_end)
        except ValueError:
            raise HTTPException(400, "date must be YYYY-MM-DD")

    appts = q.order_by(Appointment.datetime).all()
    return [_serialize_appointment(a) for a in appts]


@router.post("")
def create_appointment(
    body: AppointmentCreate,
    business_id: Optional[int] = Query(None),
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    biz_id = _biz_id(current_user, business_id)
    try:
        start_dt = datetime.strptime(f"{body.date} {body.start_time}", "%Y-%m-%d %H:%M")
    except ValueError:
        raise HTTPException(400, "Invalid date or start_time format")

    appt = Appointment(
        business_id=biz_id,
        customer_name=body.customer_name,
        phone=body.phone,
        datetime=start_dt,
        duration=body.duration,
        status="pending",
        created_at=datetime.utcnow(),
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return _serialize_appointment(appt)


@router.patch("/{appointment_id}")
def update_appointment_status(
    appointment_id: int,
    body: AppointmentStatusUpdate,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    valid_statuses = {"pending", "confirmed", "completed", "cancelled"}
    if body.status not in valid_statuses:
        raise HTTPException(400, f"status must be one of: {', '.join(valid_statuses)}")

    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(404, "Appointment not found")
    if current_user.role == "BUSINESS_ADMIN" and appt.business_id != current_user.business_id:
        raise HTTPException(403, "Access denied")

    appt.status = body.status
    db.commit()
    return _serialize_appointment(appt)


@router.delete("/{appointment_id}")
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(404, "Appointment not found")
    if current_user.role == "BUSINESS_ADMIN" and appt.business_id != current_user.business_id:
        raise HTTPException(403, "Access denied")

    appt.status = "cancelled"
    db.commit()
    return {"message": "Appointment cancelled"}


# ── Slot generation ───────────────────────────────────────────────────────────

@router.get("/slots")
def get_slots(
    date: str = Query(..., description="YYYY-MM-DD"),
    business_id: Optional[int] = Query(None),
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    biz_id = _biz_id(current_user, business_id)
    biz = _get_business(db, biz_id)
    wh  = _get_or_create_working_hours(db, biz_id, biz)

    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(400, "date must be YYYY-MM-DD")

    slot_duration      = biz.slot_duration      or 30
    min_duration       = biz.min_booking_duration or 30
    max_duration       = biz.max_booking_duration or 120

    # Load existing non-cancelled appointments for the day
    day_start = datetime.combine(target_date, __import__('datetime').time(0, 0))
    day_end   = datetime.combine(target_date, __import__('datetime').time(23, 59))
    appts_today = (
        db.query(Appointment)
        .filter(
            Appointment.business_id == biz_id,
            Appointment.datetime >= day_start,
            Appointment.datetime <= day_end,
            Appointment.status != "cancelled",
        )
        .all()
    )
    booked = [(a.datetime, a.duration or slot_duration) for a in appts_today]

    # Load breaks
    breaks_raw = db.query(BusinessBreak).filter(BusinessBreak.business_id == biz_id).all()
    breaks = [(b.start_time, b.end_time) for b in breaks_raw]

    available = generate_available_slots(
        target_date=target_date,
        work_start=wh.start_time,
        work_end=wh.end_time,
        slot_duration=slot_duration,
        booked=booked,
        breaks=breaks,
    )

    return {
        "date": date,
        "working_hours": {"start": wh.start_time, "end": wh.end_time},
        "slot_duration": slot_duration,
        "allowed_durations": [
            {"minutes": d, "label": format_duration(d)}
            for d in get_allowed_durations(slot_duration, min_duration, max_duration)
        ],
        "breaks": [
            {"id": b.id, "start": b.start_time, "end": b.end_time, "label": b.label}
            for b in breaks_raw
        ],
        "available_slots": available,
        "appointments": [_serialize_appointment(a) for a in appts_today if a.status != "cancelled"],
    }


# ── Dashboard compat ──────────────────────────────────────────────────────────

@router.get("/today")
def today_bookings(
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end   = today_start.replace(hour=23, minute=59, second=59)
    q = db.query(Appointment).filter(
        Appointment.datetime >= today_start,
        Appointment.datetime <= today_end,
    )
    if current_user.role == "BUSINESS_ADMIN":
        q = q.filter(Appointment.business_id == current_user.business_id)
    appts = q.order_by(Appointment.datetime).all()
    return [_serialize_appointment(a) for a in appts]


@router.get("/recent")
def recent_bookings(
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    q = db.query(Appointment)
    if current_user.role == "BUSINESS_ADMIN":
        q = q.filter(Appointment.business_id == current_user.business_id)
    appts = q.order_by(Appointment.datetime.desc()).limit(5).all()
    return [_serialize_appointment(a) for a in appts]


# ── Booking config ────────────────────────────────────────────────────────────

@router.get("/config")
def get_booking_config(
    business_id: Optional[int] = Query(None),
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    biz_id = _biz_id(current_user, business_id)
    biz = _get_business(db, biz_id)
    wh  = _get_or_create_working_hours(db, biz_id, biz)
    breaks = db.query(BusinessBreak).filter(BusinessBreak.business_id == biz_id).all()

    slot_duration = biz.slot_duration or 30
    min_duration  = biz.min_booking_duration or 30
    max_duration  = biz.max_booking_duration or 120

    return {
        "slot_duration": slot_duration,
        "min_booking_duration": min_duration,
        "max_booking_duration": max_duration,
        "allowed_durations": [
            {"minutes": d, "label": format_duration(d)}
            for d in get_allowed_durations(slot_duration, min_duration, max_duration)
        ],
        "working_hours": {"start": wh.start_time, "end": wh.end_time},
        "breaks": [
            {"id": b.id, "start": b.start_time, "end": b.end_time, "label": b.label}
            for b in breaks
        ],
    }


@router.put("/config")
def update_slot_config(
    body: SlotConfigUpdate,
    business_id: Optional[int] = Query(None),
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    biz_id = _biz_id(current_user, business_id)
    biz = _get_business(db, biz_id)

    if body.slot_duration is not None:
        if body.slot_duration < 5:
            raise HTTPException(400, "slot_duration must be at least 5 minutes")
        biz.slot_duration = body.slot_duration
    if body.min_booking_duration is not None:
        biz.min_booking_duration = body.min_booking_duration
    if body.max_booking_duration is not None:
        biz.max_booking_duration = body.max_booking_duration

    db.commit()
    return {"message": "Slot config updated"}


@router.put("/config/hours")
def update_working_hours(
    body: WorkingHoursUpdate,
    business_id: Optional[int] = Query(None),
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    biz_id = _biz_id(current_user, business_id)
    biz = _get_business(db, biz_id)
    wh = _get_or_create_working_hours(db, biz_id, biz)

    wh.start_time = body.start_time
    wh.end_time   = body.end_time
    # Also update the legacy string field for display
    biz.working_hours = f"{body.start_time}-{body.end_time}"

    db.commit()
    return {"start": wh.start_time, "end": wh.end_time}


@router.post("/config/breaks")
def add_break(
    body: BreakCreate,
    business_id: Optional[int] = Query(None),
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    biz_id = _biz_id(current_user, business_id)
    b = BusinessBreak(
        business_id=biz_id,
        start_time=body.start_time,
        end_time=body.end_time,
        label=body.label or "Break",
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    return {"id": b.id, "start": b.start_time, "end": b.end_time, "label": b.label}


@router.delete("/config/breaks/{break_id}")
def delete_break(
    break_id: int,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    b = db.query(BusinessBreak).filter(BusinessBreak.id == break_id).first()
    if not b:
        raise HTTPException(404, "Break not found")
    if current_user.role == "BUSINESS_ADMIN" and b.business_id != current_user.business_id:
        raise HTTPException(403, "Access denied")
    db.delete(b)
    db.commit()
    return {"message": "Break deleted"}
