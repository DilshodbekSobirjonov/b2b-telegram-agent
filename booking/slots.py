"""
Slot generation logic for booking mode.

Pure functions — no DB access here, all DB loading is in the API layer.
"""
from datetime import datetime, date, time, timedelta
from typing import List, Tuple


def _parse_time(t: str) -> time:
    h, m = map(int, t.split(":"))
    return time(h, m)


def generate_available_slots(
    target_date: date,
    work_start: str,   # "HH:MM"
    work_end: str,     # "HH:MM"
    slot_duration: int,                           # minutes
    booked: List[Tuple[datetime, int]],           # (start_datetime, duration_mins)
    breaks: List[Tuple[str, str]],                # [("12:00", "13:00"), ...]
) -> List[str]:
    """
    Returns list of available slot start times as 'HH:MM' strings.

    Algorithm:
    1. Generate all slots from work_start to work_end spaced by slot_duration.
    2. Remove slots that overlap any booked appointment.
    3. Remove slots that overlap any break period.
    """
    start_dt = datetime.combine(target_date, _parse_time(work_start))
    end_dt   = datetime.combine(target_date, _parse_time(work_end))

    break_ranges: List[Tuple[datetime, datetime]] = [
        (
            datetime.combine(target_date, _parse_time(b[0])),
            datetime.combine(target_date, _parse_time(b[1])),
        )
        for b in breaks
    ]

    available: List[str] = []
    current = start_dt

    while current + timedelta(minutes=slot_duration) <= end_dt:
        slot_end = current + timedelta(minutes=slot_duration)
        occupied = False

        for appt_start, duration in booked:
            appt_end = appt_start + timedelta(minutes=duration)
            if current < appt_end and slot_end > appt_start:
                occupied = True
                break

        if not occupied:
            for b_start, b_end in break_ranges:
                if current < b_end and slot_end > b_start:
                    occupied = True
                    break

        if not occupied:
            available.append(current.strftime("%H:%M"))

        current += timedelta(minutes=slot_duration)

    return available


def get_allowed_durations(
    slot_duration: int,
    min_duration: int,
    max_duration: int,
) -> List[int]:
    """
    Returns allowed booking durations in minutes.
    Only multiples of slot_duration within [min_duration, max_duration].
    """
    durations: List[int] = []
    d = min_duration
    while d <= max_duration:
        if d % slot_duration == 0:
            durations.append(d)
        d += slot_duration
    return durations


def format_duration(minutes: int) -> str:
    """30 → '30m', 60 → '1h', 90 → '1h30'"""
    if minutes < 60:
        return f"{minutes}m"
    h = minutes // 60
    m = minutes % 60
    return f"{h}h{m}" if m else f"{h}h"
