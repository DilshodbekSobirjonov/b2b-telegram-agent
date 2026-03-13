"use client"

import { Bot, Power, MessageSquare } from "lucide-react"

export default function BotsPage() {
  // Merge with mock fallback until endpoint is live
  const bots = [
    { id: 'b1', name: 'Dental Booking Bot', status: 'online', provider: 'anthropic', messagesProcessed: 1420 },
    { id: 'b2', name: 'Legal FAQ Assistant', status: 'online', provider: 'openai', messagesProcessed: 5600 },
    { id: 'b3', name: 'Auto Repair Scheduler', status: 'offline', provider: 'gemini', messagesProcessed: 320 },
  ]

  const loading = false
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bots Management</h1>
        <p className="text-muted-foreground">Configure and monitor your active Telegram gateways.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-muted-foreground">Loading bots...</p>
        ) : bots?.map((bot) => (
          <div key={bot.id} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col gap-6 hover:border-primary/50 transition-colors">
            
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 ${bot.status === 'online' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-muted-foreground'}`}>
                <Power className="w-3 h-3" />
                {bot.status.toUpperCase()}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-foreground">{bot.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">Provider: <span className="font-semibold text-primary">{bot.provider}</span></p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">{bot.messagesProcessed.toLocaleString()}</span> messages processed
            </div>

            <button className="mt-2 w-full py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
              Configure Bot
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
