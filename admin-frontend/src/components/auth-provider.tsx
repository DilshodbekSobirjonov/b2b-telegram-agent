"use client"

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
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
      return;
    }
    
    try {
      setSession(JSON.parse(sessionStr));
    } catch (err) {
      console.error("Failed to parse user session", err);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_session');
      Cookies.remove('auth_token');
      setSession(null);
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
    Cookies.remove('auth_token');
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
