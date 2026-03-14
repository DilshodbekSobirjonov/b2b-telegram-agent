"use client"

import { useState } from "react"
import useSWR from "swr"
import { api } from "@/lib/api"
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Phone, CheckCircle, XCircle, Plus } from "lucide-react"

interface SlotData {
  date: string
  working_hours: { start: string; end: string }
  slot_duration: number
  allowed_durations: { minutes: number; label: string }[]
  breaks: { id: number; start: string; end: string; label: string }[]
  available_slots: string[]
  appointments: Appointment[]
}

interface Appointment {
  id: number
  customer_name: string | null
  phone: string | null
  start_time: string | null
  duration: number
  status: string
}

interface BookForm {
  customer_name: string
  phone: string
  start_time: string
  duration: string
}

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0]
}

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-500/15 text-amber-400 border-amber-500/30",
  confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  completed: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  cancelled: "bg-slate-500/15 text-slate-400 border-slate-500/30",
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [bookModal, setBookModal] = useState(false)
  const [bookForm, setBookForm] = useState<BookForm>({ customer_name: "", phone: "", start_time: "", duration: "30" })
  const [saving, setSaving] = useState(false)
  const [bookError, setBookError] = useState("")

  const dateStr = toDateStr(selectedDate)
  const { data, mutate, isLoading } = useSWR<SlotData>(
    `/api/bookings/slots?date=${dateStr}`,
    api.fetcher
  )

  const openBook = (slot: string) => {
    setBookForm(f => ({ ...f, start_time: slot, duration: String(data?.slot_duration || 30) }))
    setBookError("")
    setBookModal(true)
  }

  const handleBook = async () => {
    if (!bookForm.customer_name.trim()) { setBookError("Customer name is required"); return }
    setSaving(true); setBookError("")
    try {
      await api.post("/api/bookings", {
        customer_name: bookForm.customer_name,
        phone: bookForm.phone || null,
        date: dateStr,
        start_time: bookForm.start_time,
        duration: parseInt(bookForm.duration),
      })
      await mutate()
      setBookModal(false)
    } catch (e: any) { setBookError(e.message || "Failed to book") }
    finally { setSaving(false) }
  }

  const handleStatusChange = async (appt: Appointment, status: string) => {
    try { await api.patch(`/api/bookings/${appt.id}`, { status }); await mutate() }
    catch (e: any) { alert(e.message || "Failed to update") }
  }

  // Build time grid from working hours
  const buildGrid = () => {
    if (!data) return []
    const { start, end } = data.working_hours
    const [sh, sm] = start.split(":").map(Number)
    const [eh, em] = end.split(":").map(Number)
    const slots: { time: string; status: "available" | "booked" | "break"; appointment?: Appointment }[] = []

    const current = new Date(2000, 0, 1, sh, sm)
    const endTime = new Date(2000, 0, 1, eh, em)
    const dur = data.slot_duration

    while (current < endTime) {
      const timeStr = `${String(current.getHours()).padStart(2, "0")}:${String(current.getMinutes()).padStart(2, "0")}`

      // Check break
      const inBreak = data.breaks.some(b => timeStr >= b.start && timeStr < b.end)
      if (inBreak) {
        slots.push({ time: timeStr, status: "break" })
      } else {
        const appt = data.appointments.find(a => a.start_time === timeStr)
        if (appt) {
          slots.push({ time: timeStr, status: "booked", appointment: appt })
        } else if (data.available_slots.includes(timeStr)) {
          slots.push({ time: timeStr, status: "available" })
        } else {
          slots.push({ time: timeStr, status: "booked" }) // occupied by multi-slot booking
        }
      }

      current.setMinutes(current.getMinutes() + dur)
    }
    return slots
  }

  const grid = buildGrid()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Booking Calendar</h1>
          <p className="text-muted-foreground">View and manage daily appointments.</p>
        </div>
        <div className="flex gap-2 text-xs">
          {[
            { color: "bg-emerald-500", label: "Available" },
            { color: "bg-rose-500", label: "Booked" },
            { color: "bg-slate-500", label: "Break" },
          ].map(l => (
            <span key={l.label} className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-lg">
              <span className={`w-2 h-2 rounded-full ${l.color}`} /> {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* Date nav */}
      <div className="flex items-center gap-4">
        <button onClick={() => setSelectedDate(d => addDays(d, -1))} className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">
            {selectedDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
        </div>
        <button onClick={() => setSelectedDate(d => addDays(d, 1))} className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
        <button onClick={() => setSelectedDate(new Date())} className="ml-2 text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
          Today
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time grid */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          {isLoading && (
            <div className="p-8 text-center text-muted-foreground">Loading slots...</div>
          )}
          {!isLoading && grid.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No working hours configured for this business.</div>
          )}
          <div className="divide-y divide-border/40">
            {grid.map(slot => (
              <div key={slot.time} className={`flex items-center gap-4 px-4 py-2.5 transition-colors ${slot.status === "available" ? "hover:bg-emerald-500/5 cursor-pointer" : ""}`}
                onClick={() => slot.status === "available" && openBook(slot.time)}>
                <span className="text-sm font-mono text-muted-foreground w-14 shrink-0">{slot.time}</span>
                {slot.status === "available" && (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-sm text-emerald-400">Available</span>
                    <Plus className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
                  </div>
                )}
                {slot.status === "break" && (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
                    <span className="text-sm text-slate-400">
                      {data?.breaks.find(b => slot.time >= b.start && slot.time < b.end)?.label || "Break"}
                    </span>
                  </div>
                )}
                {slot.status === "booked" && slot.appointment && (
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{slot.appointment.customer_name || "Guest"}</p>
                      <p className="text-xs text-muted-foreground">{slot.appointment.duration}min · {slot.appointment.phone || ""}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${STATUS_COLORS[slot.appointment.status] || ""}`}>
                      {slot.appointment.status}
                    </span>
                  </div>
                )}
                {slot.status === "booked" && !slot.appointment && (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500/50 shrink-0" />
                    <span className="text-sm text-muted-foreground">Occupied</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Appointments list */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-primary" />
              {dateStr === toDateStr(new Date()) ? "Today's Appointments" : "Appointments"}
              <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{data?.appointments.length || 0}</span>
            </h3>
            {(!data?.appointments || data.appointments.length === 0) && (
              <p className="text-sm text-muted-foreground">No appointments for this day.</p>
            )}
            {data?.appointments.map(a => (
              <div key={a.id} className="py-3 border-b border-border/50 last:border-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground">{a.customer_name || "Guest"}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${STATUS_COLORS[a.status] || ""}`}>{a.status}</span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {a.start_time} · {a.duration}min</p>
                {a.phone && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {a.phone}</p>}
                {a.status === "pending" && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleStatusChange(a, "confirmed")}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                      <CheckCircle className="w-3 h-3" /> Confirm
                    </button>
                    <button onClick={() => handleStatusChange(a, "cancelled")}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors">
                      <XCircle className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                )}
                {a.status === "confirmed" && (
                  <button onClick={() => handleStatusChange(a, "completed")}
                    className="mt-2 flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors">
                    <CheckCircle className="w-3 h-3" /> Mark Complete
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Book modal */}
      {bookModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-foreground mb-1">New Appointment</h2>
            <p className="text-sm text-muted-foreground mb-5">{selectedDate.toLocaleDateString()} at {bookForm.start_time}</p>
            {bookError && <div className="bg-rose-500/10 text-rose-400 text-sm p-3 rounded-lg mb-4 border border-rose-500/20">{bookError}</div>}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Customer Name *</label>
                <input value={bookForm.customer_name} onChange={e => setBookForm(f => ({ ...f, customer_name: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary text-foreground" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Phone</label>
                <input value={bookForm.phone} onChange={e => setBookForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+1 234 567 8900"
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary text-foreground" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Duration</label>
                <select value={bookForm.duration} onChange={e => setBookForm(f => ({ ...f, duration: e.target.value }))}
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary text-foreground">
                  {(data?.allowed_durations || [{ minutes: 30, label: "30m" }]).map(d => (
                    <option key={d.minutes} value={d.minutes}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setBookModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors text-sm">Cancel</button>
              <button onClick={handleBook} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50">
                {saving ? "Booking..." : "Book Slot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
