"use client"

import { useTheme } from "next-themes"
import { Search, Moon, Sun, Bell, LogOut } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export function Topbar() {
  const { theme, setTheme } = useTheme()
  const { logout, session } = useAuth()

  return (
    <div className="h-16 border-b border-border bg-card/30 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10 w-full transition-colors">
      <div className="flex items-center bg-background rounded-xl px-3 py-2 w-96 border border-border focus-within:ring-1 focus-within:ring-primary transition-all">
        <Search className="w-4 h-4 text-muted-foreground mr-2" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="relative p-2 rounded-xl bg-background border border-border hover:bg-muted transition-colors flex items-center justify-center overflow-hidden"
          title="Toggle Theme"
        >
          <Sun className="h-4 w-4 transition-all dark:-rotate-90 dark:opacity-0" />
          <Moon className="absolute h-4 w-4 transition-all rotate-90 opacity-0 dark:rotate-0 dark:opacity-100" />
          <span className="sr-only">Toggle theme</span>
        </button>

        <button className="p-2 rounded-xl bg-background border border-border hover:bg-muted transition-colors" title="Notifications">
          <Bell className="w-4 h-4 text-foreground" />
        </button>

        <button
          onClick={logout}
          className="p-2 rounded-xl bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors text-rose-500 group"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>

        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm cursor-pointer shadow-sm ml-1">
          {session?.username?.charAt(0).toUpperCase() ?? 'U'}
        </div>
      </div>
    </div>
  );
}
