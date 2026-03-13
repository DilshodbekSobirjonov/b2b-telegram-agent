"use client"

import useSWR from "swr"
import { api } from "@/lib/api"
import { BarChart3, TrendingUp, MessageSquare, Bot, Calendar, Users } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

export default function AnalyticsPage() {
  const { data: stats } = useSWR<any>('/api/dashboard/stats', api.fetcher)
  const { data: chartData } = useSWR<any[]>('/api/dashboard/chart', api.fetcher)

  const kpis = [
    { label: "Total Appointments", value: stats?.appointments ?? "...", icon: Calendar, color: "from-indigo-500 to-purple-500" },
    { label: "Active Bots", value: stats?.activeBots ?? "...", icon: Bot, color: "from-emerald-500 to-teal-500" },
    { label: "Total Businesses", value: stats?.totalBusinesses ?? "...", icon: Users, color: "from-orange-500 to-rose-500" },
    { label: "AI Requests Today", value: stats?.aiRequestsToday ?? "...", icon: MessageSquare, color: "from-cyan-500 to-blue-500" },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Platform-wide performance data and trends.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:border-primary/30 transition-colors">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${kpi.color} flex items-center justify-center mb-4 shadow`}>
              <kpi.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-muted-foreground text-sm">{kpi.label}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings over time */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Monthly Bookings
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            {chartData && chartData.length > 0 ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="bookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Area type="monotone" dataKey="bookings" stroke="#6366f1" fill="url(#bookings)" strokeWidth={2} />
              </AreaChart>
            ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                  No chart data available for this week.
                </div>
            )}
          </ResponsiveContainer>
        </div>

        {/* Revenue over time */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Monthly Revenue ($)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            {chartData && chartData.length > 0 ? (
              <BarChart data={chartData.map(d => ({ ...d, revenue: d.bookings * 50 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
                  formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Estimated Revenue']} />
                <Bar dataKey="revenue" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                 Insufficient data for revenue charts.
              </div>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
