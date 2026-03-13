"use client"

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  session: null, 
  loading: true, 
  logout: () => {},
  refreshSession: async () => {} 
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const refreshSession = async () => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('auth_token');
    const sessionStr = localStorage.getItem('user_session');

    if (!token || !sessionStr) {
      setSession(null);
      setLoading(false);
      if (pathnameRef.current !== '/login') router.push('/login');
      return;
    }
    
    try {
      setSession(JSON.parse(sessionStr));
    } catch (err) {
      console.error("Failed to parse user session", err);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_session');
      setSession(null);
      if (pathnameRef.current !== '/login') router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);   // Run once on mount only

  const logout = async () => {
    try {
      await api.post('/api/auth/logout', {});
    } catch (err) {
      console.error("Logout request failed", err);
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_session');
    setSession(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ session, loading, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
