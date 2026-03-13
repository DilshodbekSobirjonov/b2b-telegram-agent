"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Users, Building2, Bot, Cpu, Settings,
  CalendarDays, MessageSquare, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';

const SUPER_ADMIN_NAV = [
  { icon: Home,        label: 'Dashboard',      href: '/dashboard' },
  { icon: Building2,   label: 'Businesses',     href: '/dashboard/businesses' },
  { icon: Cpu,         label: 'AI Settings',    href: '/dashboard/ai' },
  { icon: Users,       label: 'Clients',        href: '/dashboard/clients' },
  { icon: BarChart3,   label: 'Analytics',      href: '/dashboard/analytics' },
];

const BUSINESS_ADMIN_NAV = [
  { icon: Home,          label: 'Dashboard',      href: '/dashboard' },
  { icon: CalendarDays,  label: 'Calendar',       href: '/dashboard/calendar' },
  { icon: Users,         label: 'Clients',        href: '/dashboard/clients' },
  { icon: MessageSquare, label: 'Conversations',  href: '/dashboard/conversations' },
  { icon: Settings,      label: 'Settings',       href: '/dashboard/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { session } = useAuth();

  const navItems = session?.role === 'BUSINESS_ADMIN' ? BUSINESS_ADMIN_NAV : SUPER_ADMIN_NAV;

  return (
    <div className="flex flex-col w-64 h-screen px-4 py-8 bg-card/50 backdrop-blur-md border-r border-border fixed left-0 top-0 z-20">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-base font-bold text-foreground block leading-tight">B2B Agent</span>
          {session && (
            <span className={cn(
              "text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded",
              session.role === 'SUPER_ADMIN'
                ? 'bg-indigo-500/15 text-indigo-400'
                : 'bg-emerald-500/15 text-emerald-400'
            )}>
              {session.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Business Admin'}
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm",
                isActive
                  ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Role Badge at bottom */}
      {session && (
        <div className="mt-4 px-3 py-3 rounded-xl bg-muted/40 border border-border">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="text-sm font-semibold text-foreground truncate">{session.username}</p>
          {session.business_id && (
            <p className="text-xs text-muted-foreground">Business ID: {session.business_id}</p>
          )}
        </div>
      )}
    </div>
  );
}
