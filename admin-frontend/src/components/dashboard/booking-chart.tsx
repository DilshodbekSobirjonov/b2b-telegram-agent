"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';
import { ActivityChartData } from '@/types/dashboard';

interface BookingChartProps {
  data: ActivityChartData[];
}

export function BookingChart({ data }: BookingChartProps) {
  const { theme } = useTheme();
  
  const isDark = theme === 'dark';
  const strokeColor = '#6366f1'; // Indigo 500
  const fillColor = '#a855f7';   // Purple 500
  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-96">
      <h3 className="text-lg font-semibold text-foreground mb-4">Weekly Bookings Activity</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={fillColor} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={fillColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis dataKey="date" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                borderColor: gridColor,
                borderRadius: '12px',
                color: isDark ? '#f8fafc' : '#0f172a',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
              }}
            />
            <Area type="monotone" dataKey="bookings" stroke={strokeColor} strokeWidth={3} fillOpacity={1} fill="url(#colorBookings)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
