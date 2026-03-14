"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Cookies from 'js-cookie'

export interface Session {
  user_id: number
  username: string
  role: 'SUPER_ADMIN' | 'BUSINESS_ADMIN'
  business_id?: number
  assistant_type?: 'sales' | 'booking'
}

interface AuthContextType {
  session: Session | null
  loading: boolean
  logout: () => void
  refreshSession: () => void
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  logout: () => {},
  refreshSession: () => {},
})

function readStorage(): Session | null {
  try {
    const token = localStorage.getItem('auth_token')
    const str = localStorage.getItem('user_session')
    if (!token || !str) return null
    return JSON.parse(str)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = readStorage()
    setSession(stored)
    if (stored) {
      api.get('/api/auth/session').then((fresh: any) => {
        const updated = { ...stored, ...fresh }
        localStorage.setItem('user_session', JSON.stringify(updated))
        setSession(updated as Session)
      }).catch(() => {})
    }
    setLoading(false)
  }, [])

  const refreshSession = () => {
    setSession(readStorage())
    setLoading(false)
  }

  const logout = async () => {
    try { await api.post('/api/auth/logout', {}) } catch {}
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_session')
    Cookies.remove('auth_token')
    setSession(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ session, loading, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
