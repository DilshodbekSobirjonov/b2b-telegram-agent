"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!session) {
        window.location.href = '/login'
      } else {
        setReady(true)
      }
    }
  }, [loading, session])

  if (!ready) return <div className="min-h-screen bg-background" />

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
