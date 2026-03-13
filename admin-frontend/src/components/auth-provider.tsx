"use client"

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';

export interface Session {
  user_id: number;
  username: string;
  role: 'SUPER_ADMIN' | 'BUSINESS_ADMIN';
  business_id?: number;
}

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ session: null, loading: true, logout: () => {} });

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get('auth_token');

      if (!token) {
        setSession(null);
        setLoading(false);
        if (pathname !== '/login') router.push('/login');
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/session`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Session invalid');

        const data: Session = await res.json();
        setSession(data);
      } catch {
        Cookies.remove('auth_token');
        setSession(null);
        if (pathname !== '/login') router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);   // Run once on mount only

  const logout = async () => {
    const token = Cookies.get('auth_token');
    if (token) {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    Cookies.remove('auth_token');
    setSession(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ session, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
