"use client"

import { Settings, Bell, Palette, Lock, ChevronRight } from "lucide-react"

const settingsSections = [
  {
    title: "Notifications",
    icon: Bell,
    description: "Configure email and Telegram alerts",
    items: ["New booking alerts", "Daily digest", "Payment reminders"]
  },
  {
    title: "Appearance",
    icon: Palette,
    description: "Theme and display preferences",
    items: ["Dark / Light mode", "Language", "Timezone"]
  },
  {
    title: "Security",
    icon: Lock,
    description: "Password and session management",
    items: ["Change password", "Active sessions", "2FA setup"]
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and bot configuration.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {settingsSections.map((section) => (
          <div key={section.title} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <section.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{section.title}</h3>
                <p className="text-xs text-muted-foreground">{section.description}</p>
              </div>
            </div>
            <div className="space-y-1">
              {section.items.map(item => (
                <button key={item} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {item}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
