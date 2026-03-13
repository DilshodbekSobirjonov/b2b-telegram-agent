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
  const [session, setSession] = useState<Session | null>(() => {
    if (typeof window === 'undefined') return null;
    const sessionStr = localStorage.getItem('user_session');
    try {
      return sessionStr ? JSON.parse(sessionStr) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window === 'undefined') return true;
    const token = localStorage.getItem('auth_token');
    const sessionStr = localStorage.getItem('user_session');
    // If we have data, we're not "loading" - we're ready
    return !(token && sessionStr);
  });
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
  }, []);

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_session');
    setSession(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ session, loading, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
