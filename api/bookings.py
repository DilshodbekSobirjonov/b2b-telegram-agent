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
  PATCH /api/bookings/config      — update slot_duration / min / max / buffer
  PUT  /api/bookings/config/hours — set working hours (start/end)
  POST /api/bookings/config/breaks — add a break period
  DELETE /api/bookings/config/breaks/{break_id} — remove a break period
  POST /api/bookings/config/closed-days — add a holiday/closed day
  DELETE /api/bookings/config/closed-days/{cd_id} — remove a holiday/closed day
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

from database.repository import Repository
from database.models import Appointment, Business, WorkingHours, BusinessBreak, BusinessClosedDay
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
    from database.models import Service
    from database.repository import SessionLocal
    service_name = "Appointment"
    if a.service_id:
        db = SessionLocal()
        try:
            s = db.query(Service).filter(Service.id == a.service_id).first()
            if s:
                service_name = s.name
        finally:
            db.close()
            
    return {
        "id": a.id,
        "customer_name": a.customer_name, # keep old for compat
        "clientName": a.customer_name or "Guest",
        "phone": a.phone,
        "start_time": a.datetime.strftime("%H:%M") if a.datetime else None,
        "time": a.datetime.strftime("%H:%M") if a.datetime else None,
        "date": a.datetime.strftime("%Y-%m-%d") if a.datetime else None,
        "duration": a.duration or 30,
        "service": service_name,
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
    buffer_after: Optional[int] = None


class WorkingHoursUpdate(BaseModel):
    start_time: str  # "HH:MM"
    end_time: str    # "HH:MM"


class BreakCreate(BaseModel):
    start_time: str   # "HH:MM"
    end_time: str     # "HH:MM"
    label: Optional[str] = None

class ClosedDayCreate(BaseModel):
    date: str  # YYYY-MM-DD
    reason: Optional[str] = None


# ── Booking config (Move BEFORE generic routes) ───────────────────────────────

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
    closed_days = db.query(BusinessClosedDay).filter(BusinessClosedDay.business_id == biz_id).all()

    slot_duration = biz.slot_duration or 30
    min_duration  = biz.min_booking_duration or 30
    max_duration  = biz.max_booking_duration or 120

    return {
        "slot_duration": slot_duration,
        "min_booking_duration": min_duration,
        "max_booking_duration": max_duration,
        "buffer_after": biz.buffer_after or 0,
        "allowed_durations": [
            {"minutes": d, "label": format_duration(d)}
            for d in get_allowed_durations(slot_duration, min_duration, max_duration)
        ],
        "working_hours": {"start": wh.start_time, "end": wh.end_time},
        "breaks": [
            {"id": b.id, "start": b.start_time, "end": b.end_time, "label": b.label}
            for b in breaks
        ],
        "closed_days": [
            {"id": cd.id, "date": cd.date.strftime("%Y-%m-%d"), "reason": cd.reason}
            for cd in closed_days
        ],
    }


@router.patch("/config")
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
    if body.buffer_after is not None:
        biz.buffer_after = body.buffer_after

    db.commit()
    return {"message": "DEBUG: Slot config updated", "buffer_after": biz.buffer_after}


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
    brk = BusinessBreak(
        business_id=biz_id,
        start_time=body.start_time,
        end_time=body.end_time,
        label=body.label or "Break",
    )
    db.add(brk)
    db.commit()
    db.refresh(brk)
    return {"id": brk.id, "start": brk.start_time, "end": brk.end_time, "label": brk.label}


@router.delete("/config/breaks/{break_id}")
def delete_break(
    break_id: int,
    business_id: Optional[int] = Query(None),
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user),
):
    biz_id = _biz_id(current_user, business_id)
    brk = db.query(BusinessBreak).filter(
        BusinessBreak.id == break_id,
        BusinessBreak.business_id == biz_id
    ).first()
    
    if not brk:
        raise HTTPException(404, "Break not found")
        
    db.delete(brk)
    db.commit()
    return {"message": "Break deleted"}


@router.post("/config/closed-days")
def add_closed_day(
    body: ClosedDayCreate,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    biz_id = current_user.business_id
    if not biz_id:
        raise HTTPException(400, "Only business admins can manage closed days")
        
    try:
        dt = datetime.strptime(body.date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(400, "Invalid date format. Use YYYY-MM-DD")
        
    new_cd = BusinessClosedDay(
        business_id=biz_id,
        date=dt,
        reason=body.reason
    )
    db.add(new_cd)
    db.commit()
    return {"message": "Closed day added", "id": new_cd.id}

@router.delete("/config/closed-days/{cd_id}")
def delete_closed_day(
    cd_id: int,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    biz_id = current_user.business_id
    from database.models import BusinessClosedDay
    cd = db.query(BusinessClosedDay).filter(
        BusinessClosedDay.id == cd_id,
        BusinessClosedDay.business_id == biz_id
    ).first()
    
    if not cd:
        raise HTTPException(404, "Closed day not found")
        
    db.delete(cd)
    db.commit()
    return {"message": "Closed day removed"}


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
    import datetime as dt_mod
    day_start = datetime.combine(target_date, dt_mod.time(0, 0))
    day_end   = datetime.combine(target_date, dt_mod.time(23, 59))
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

    # Load closed days
    closed_days_raw = db.query(BusinessClosedDay).filter(BusinessClosedDay.business_id == biz_id).all()
    closed_days = [cd.date.date() for cd in closed_days_raw]

    available = generate_available_slots(
        target_date=target_date,
        work_start=wh.start_time,
        work_end=wh.end_time,
        slot_duration=slot_duration,
        booked=booked,
        breaks=breaks,
        buffer_after=biz.buffer_after or 0,
        closed_days=closed_days
    )

    return {
        "date": date,
        "working_hours": {"start": wh.start_time, "end": wh.end_time},
        "slot_duration": slot_duration,
        "buffer_after": biz.buffer_after or 0,
        "allowed_durations": [
            {"minutes": d, "label": format_duration(d)}
            for d in get_allowed_durations(slot_duration, min_duration, max_duration)
        ],
        "breaks": [
            {"id": b.id, "start": b.start_time, "end": b.end_time, "label": b.label}
            for b in breaks_raw
        ],
        "closed_days": [
            {"id": cd.id, "date": cd.date.strftime("%Y-%m-%d"), "reason": cd.reason}
            for cd in closed_days_raw
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
