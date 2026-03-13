import { format, startOfWeek, addDays, parse, addMinutes, isBefore, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

interface Slot {
  time: string;
  durationMinutes: number;
  status: 'available' | 'booked' | 'blocked';
}

interface CalendarProps {
  onSlotClick?: (slot: Slot, day: Date) => void;
  openHour?: string;
  closeHour?: string;
  slotIntervalMinutes?: number;
}

export function Calendar({ 
  onSlotClick, 
  openHour = "08:00", 
  closeHour = "17:00",
  slotIntervalMinutes = 30
}: CalendarProps) {
  const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  // Generate timeline slots based on operating hours
  const generateTimeline = () => {
    const timeline = [];
    let current = parse(openHour, 'HH:mm', new Date());
    const end = parse(closeHour, 'HH:mm', new Date());

    while (isBefore(current, end)) {
      timeline.push(format(current, 'HH:mm'));
      current = addMinutes(current, slotIntervalMinutes);
    }
    return timeline;
  };

  const timeline = generateTimeline();

  // Mock slot data logic spanning multiple intervals
  const getSlotStatus = (dayIndex: number, timeStr: string): Slot => {
    const hour = parseInt(timeStr.split(':')[0]);
    if (dayIndex === 5 || dayIndex === 6) return { time: timeStr, durationMinutes: slotIntervalMinutes, status: 'blocked' }; // Weekends blocked
    
    // Simulate a 1.5 hour booking (3 slots)
    if (dayIndex === 1 && (timeStr === '10:00' || timeStr === '10:30' || timeStr === '11:00')) {
      return { time: timeStr, durationMinutes: 90, status: 'booked' };
    }
    
    // Standard 30 min booking
    if (dayIndex === 2 && timeStr === '14:30') {
      return { time: timeStr, durationMinutes: 30, status: 'booked' };
    }

    return { time: timeStr, durationMinutes: slotIntervalMinutes, status: 'available' };
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-8 gap-2 mb-4 sticky top-0 bg-card z-10 pb-2 border-b border-border">
          <div className="col-span-1 text-center font-semibold text-muted-foreground text-xs uppercase tracking-wider self-end pb-2">Timeline</div>
          {days.map((day, i) => (
            <div key={i} className="col-span-1 text-center font-semibold text-foreground bg-muted/30 rounded-lg py-2 text-sm border border-transparent hover:border-border transition-colors cursor-default">
              <span className="block opacity-70 mb-1 text-xs uppercase">{format(day, 'EEE')}</span>
              <span className={cn("text-xl", isSameDay(day, new Date()) ? "text-primary font-bold" : "")}>
                {format(day, 'dd')}
              </span>
            </div>
          ))}
        </div>

        {/* Grid Slots */}
        {timeline.map((time) => (
          <div key={time} className="grid grid-cols-8 gap-2 mb-1.5 items-stretch min-h-[40px] group">
            <div className="col-span-1 text-center text-xs text-muted-foreground font-medium flex items-center justify-center border-r border-border/50 group-hover:text-foreground transition-colors pr-2">
              {time}
            </div>
            
            {days.map((day, dIdx) => {
              const slot = getSlotStatus(dIdx, time);
              
              // Skip rendering inner block if it's implicitly covered by a large prior block in a real system. 
              // For UI demonstration, we render individual blocks visually linked
              
              return (
                <button
                  key={dIdx}
                  onClick={() => onSlotClick?.(slot, day)}
                  className={cn(
                    "col-span-1 rounded-md transition-all border border-transparent relative overflow-hidden flex items-center justify-center w-full h-full",
                    slot.status === 'available' ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:border-emerald-500/50" :
                    slot.status === 'booked' ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30 cursor-not-allowed" :
                    "bg-slate-500/10 text-slate-500 dark:text-slate-400 cursor-not-allowed repeating-linear-gradient"
                  )}
                  disabled={slot.status !== 'available'}
                  title={slot.status === 'available' ? 'Available to book' : slot.status}
                >
                  <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute">
                    {slot.status === 'available' ? 'Open' : slot.status === 'booked' ? 'Booked' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
