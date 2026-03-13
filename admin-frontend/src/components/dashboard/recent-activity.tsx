import { Booking } from '@/types/bookings';
import { cn } from '@/lib/utils';

interface RecentActivityProps {
  bookings: Booking[];
}

export function RecentActivity({ bookings }: RecentActivityProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-96 flex flex-col">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Bookings</h3>
      <div className="space-y-4 overflow-y-auto flex-1 pr-2">
        {bookings.map((booking) => (
          <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold shadow-md">
                {booking.clientName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{booking.clientName}</p>
                <p className="text-xs text-muted-foreground">{booking.service} • {booking.date}</p>
              </div>
            </div>
            
            <div className={cn(
              "px-3 py-1 text-xs font-semibold rounded-full",
              booking.status === 'confirmed' ? "bg-emerald-500/10 text-emerald-500" :
              booking.status === 'pending' ? "bg-amber-500/10 text-amber-500" :
              "bg-rose-500/10 text-rose-500"
            )}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
