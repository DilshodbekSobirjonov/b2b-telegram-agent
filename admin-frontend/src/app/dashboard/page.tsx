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
  
  if (authLoading) return null

  const { data: stats, loading: loadingStats, error: statsError } = useDataFetch<any>('/api/dashboard/stats')
  const { data: chartData, loading: loadingChart, error: chartError } = useDataFetch<any[]>('/api/dashboard/chart')
  const { data: recent, loading: loadingRecent, error: recentError } = useDataFetch<any[]>('/api/bookings/recent')

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
              value={(loadingStats && !statsError) ? "..." : `$${(stats?.totalRevenue ?? 0).toLocaleString()}`}
              trend="Monthly total" trendUp={true} icon={DollarSign}
            />
            <StatCard
              title="Active Bots"
              value={(loadingStats && !statsError) ? "..." : `${stats?.activeBots ?? 0}`}
              trend="Current active" trendUp={true} icon={Bot}
            />
            <StatCard
              title="Total Appointments"
              value={(loadingStats && !statsError) ? "..." : `${stats?.appointments ?? 0}`}
              trend="This month" trendUp={true} icon={CalendarCheck}
            />
            <StatCard
              title="AI Efficiency"
              value={(loadingStats && !statsError) ? "..." : `${stats?.aiEfficiency ?? 0}%`}
              trend="Bot vs Human" trendUp={true} icon={Zap}
            />
          </>
        ) : (
          <>
            <StatCard
              title="Today's Bookings"
              value={(loadingStats && !statsError) ? "..." : `${stats?.todayBookings ?? 0}`}
              trend="Today" trendUp={true} icon={CalendarCheck}
            />
            <StatCard
              title="Free Slots Today"
              value={(loadingStats && !statsError) ? "..." : `${stats?.freeSlots ?? 0}`}
              trend="Available now" trendUp={false} icon={Clock}
            />
            <StatCard
              title="Total Clients"
              value={(loadingStats && !statsError) ? "..." : `${stats?.totalClients ?? 0}`}
              trend="All time" trendUp={true} icon={Users}
            />
            <StatCard
              title="Weekly Growth"
              value={(loadingStats && !statsError) ? "..." : `${stats?.weeklyGrowth ?? 0}%`}
              trend="vs last week" trendUp={(stats?.weeklyGrowth ?? 0) >= 0} icon={TrendingUp}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {(loadingChart && !chartError) ? (
            <div className="bg-card border border-border rounded-xl h-80 flex items-center justify-center shadow-sm">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : chartData && chartData.length > 0 ? (
            <BookingChart data={chartData} />
          ) : (
            <div className="bg-card border border-border rounded-xl h-80 flex items-center justify-center shadow-sm">
              <p className="text-sm text-muted-foreground">No booking data yet.</p>
            </div>
          )}
        </div>
        <div className="lg:col-span-1">
          {(loadingRecent && !recentError) ? (
            <div className="bg-card border border-border rounded-xl h-80 flex items-center justify-center shadow-sm">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recent && recent.length > 0 ? (
            <RecentActivity bookings={recent} />
          ) : (
            <div className="bg-card border border-border rounded-xl h-80 flex items-center justify-center shadow-sm">
              <p className="text-sm text-muted-foreground">No recent bookings.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
