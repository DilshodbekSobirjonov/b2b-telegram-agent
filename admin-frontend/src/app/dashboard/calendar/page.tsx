"use client"

import { useState } from "react"
import useSWR from "swr"
import { api } from "@/lib/api"
import { Calendar } from "@/components/calendar/calendar"
import { CalendarDays, Clock, CheckCircle } from "lucide-react"

export default function CalendarPage() {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const { data: todayBookings } = useSWR<any[]>('/api/bookings/today', api.fetcher)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Booking Calendar</h1>
          <p className="text-muted-foreground">View and manage your weekly availability.</p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Available
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-500 rounded-lg border border-rose-500/20">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Booked
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-500/10 text-slate-500 rounded-lg border border-slate-500/20">
            <span className="w-2 h-2 rounded-full bg-slate-500" /> Blocked
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Calendar
            onSlotClick={(slot, day) => {
              if (slot.status === 'available') {
                setSelectedSlot(`${day.toDateString()} at ${slot.time}`)
              }
            }}
          />
        </div>

        <div className="space-y-4">
          {selectedSlot && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 animate-in fade-in zoom-in-95">
              <h3 className="font-semibold text-emerald-500 flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4" /> Slot Selected
              </h3>
              <p className="text-sm text-foreground">{selectedSlot}</p>
              <button className="mt-3 w-full py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors">
                Book This Slot
              </button>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <CalendarDays className="w-4 h-4 text-primary" /> Today's Bookings
            </h3>
            {!todayBookings && (
              <p className="text-sm text-muted-foreground">Loading...</p>
            )}
            {todayBookings?.length === 0 && (
              <p className="text-sm text-muted-foreground">No bookings today.</p>
            )}
            {todayBookings?.map(b => (
              <div key={b.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{b.time}</p>
                  <p className="text-xs text-muted-foreground">{b.service}</p>
                </div>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
                  b.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                }`}>{b.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
