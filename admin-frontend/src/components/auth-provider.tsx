"use client"

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';

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
        const data: Session = await api.fetcher('/api/auth/session');
        setSession(data);
      } catch (err: any) {
        console.error("Auth check failed:", err.message);
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
    try {
      await api.post('/api/auth/logout', {});
    } catch (err) {
      console.error("Logout request failed", err);
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
