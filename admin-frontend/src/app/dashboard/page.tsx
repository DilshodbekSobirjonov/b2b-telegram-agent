"use client"

import { StatCard } from "@/components/dashboard/stat-card"
import { BookingChart } from "@/components/dashboard/booking-chart"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { DollarSign, Bot, CalendarCheck, Zap, Users, Clock, TrendingUp } from "lucide-react"
import { useDataFetch } from "@/lib/hooks"
import { useAuth } from "@/components/auth-provider"

export default function DashboardPage() {
  const { session, loading: authLoading } = useAuth()
  const isSuperAdmin = session?.role === 'SUPER_ADMIN'

  const { data: stats, loading: loadingStats } = useDataFetch<any>('/api/dashboard/stats')
  const { data: chartData, loading: loadingChart } = useDataFetch<any[]>('/api/dashboard/chart')
  const { data: recent, loading: loadingRecent } = useDataFetch<any[]>('/api/bookings/recent')

  // Show skeleton while auth determines role to prevent flash of wrong content
  if (authLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-muted rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-card border border-border rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {isSuperAdmin ? 'Platform Overview' : `Welcome back, ${session?.username ?? 'Admin'}`}
        </h1>
        <p className="text-muted-foreground">
          {isSuperAdmin
            ? 'Monitor your entire B2B SaaS platform performance.'
            : "Here's what's happening with your bot today."}
        </p>
      </div>

      {/* Role-based KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isSuperAdmin ? (
          <>
            <StatCard
              title="Total Revenue"
              value={loadingStats || !stats ? "..." : `$${(stats.totalRevenue ?? 0).toLocaleString()}`}
              trend="Monthly total" trendUp={true} icon={DollarSign}
            />
            <StatCard
              title="Active Bots"
              value={loadingStats || !stats ? "..." : `${stats.activeBots ?? 0}`}
              trend="Current active" trendUp={true} icon={Bot}
            />
            <StatCard
              title="Total Appointments"
              value={loadingStats || !stats ? "..." : `${stats.appointments ?? 0}`}
              trend="This month" trendUp={true} icon={CalendarCheck}
            />
            <StatCard
              title="AI Efficiency"
              value={loadingStats || !stats ? "..." : `${stats.aiEfficiency ?? 0}%`}
              trend="Bot vs Human" trendUp={true} icon={Zap}
            />
          </>
        ) : (
          <>
            <StatCard
              title="Today's Bookings"
              value={loadingStats || !stats ? "..." : `${stats.todayBookings ?? 0}`}
              trend="Today" trendUp={true} icon={CalendarCheck}
            />
            <StatCard
              title="Free Slots Today"
              value={loadingStats || !stats ? "..." : `${stats.freeSlots ?? 0}`}
              trend="Available now" trendUp={false} icon={Clock}
            />
            <StatCard
              title="Total Clients"
              value={loadingStats || !stats ? "..." : `${stats.totalClients ?? 0}`}
              trend="All time" trendUp={true} icon={Users}
            />
            <StatCard
              title="Weekly Growth"
              value={loadingStats || !stats ? "..." : `${stats.weeklyGrowth ?? 0}%`}
              trend="vs last week" trendUp={stats?.weeklyGrowth >= 0} icon={TrendingUp}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loadingChart || !chartData ? (
            <div className="bg-card border border-border rounded-xl h-80 flex items-center justify-center shadow-sm">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Loading chart data...</p>
              </div>
            </div>
          ) : (
            <BookingChart data={chartData} />
          )}
        </div>
        <div className="lg:col-span-1">
          {loadingRecent || !recent ? (
            <div className="bg-card border border-border rounded-xl h-80 flex items-center justify-center shadow-sm">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Loading recent bookings...</p>
              </div>
            </div>
          ) : (
            <RecentActivity bookings={recent} />
          )}
        </div>
      </div>
    </div>
  )
}
