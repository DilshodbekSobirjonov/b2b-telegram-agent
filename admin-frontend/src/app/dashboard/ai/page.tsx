"use client"

import { Cpu, Key, Activity, DollarSign } from "lucide-react"

export default function AISettingsPage() {
  const providers = [
    { name: "Anthropic", status: "active", model: "claude-3-opus", requests: 124500, cost: 342.50, color: "from-amber-400 to-orange-500" },
    { name: "OpenAI", status: "active", model: "gpt-4-turbo", requests: 89000, cost: 180.20, color: "from-emerald-400 to-teal-500" },
    { name: "Gemini", status: "inactive", model: "gemini-1.5-pro", requests: 0, cost: 0.00, color: "from-blue-400 to-indigo-500" },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Engine Configuration</h1>
        <p className="text-muted-foreground">Manage Large Language Model providers, API keys, and routing limits.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {providers.map((p) => (
          <div key={p.name} className={`bg-card border ${p.status === 'active' ? 'border-border' : 'border-border/50 opacity-70'} rounded-xl overflow-hidden shadow-sm hover:border-primary/40 transition-all`}>
            
            <div className={`h-2 w-full bg-gradient-to-r ${p.color}`} />
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Cpu className="w-5 h-5" /> {p.name}
                  </h3>
                  <p className="text-sm text-primary font-mono mt-1">{p.model}</p>
                </div>
                <div className={`px-3 py-1 text-xs font-bold rounded-full ${p.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                  {p.status.toUpperCase()}
                </div>
              </div>

              <div className="space-y-4">
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Key className="w-3 h-3" /> API Key
                  </label>
                  <input 
                    type="password" 
                    value={p.status === 'active' ? 'sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxx' : ''}
                    readOnly
                    className="w-full bg-muted/50 border border-border rounded-lg py-2 px-3 text-sm font-mono text-muted-foreground focus:outline-none"
                    placeholder="Enter API Key to enable..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-muted/30 p-3 rounded-lg border border-border">
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Activity className="w-3 h-3"/> Requests</div>
                    <div className="text-lg font-bold text-foreground">{p.requests.toLocaleString()}</div>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg border border-border">
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><DollarSign className="w-3 h-3"/> Est. Cost</div>
                    <div className="text-lg font-bold text-foreground">${p.cost.toFixed(2)}</div>
                  </div>
                </div>

              </div>

              <div className="mt-6 pt-4 border-t border-border flex justify-end">
                <button className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${p.status === 'active' ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' : 'bg-primary text-white hover:bg-primary/90'}`}>
                  {p.status === 'active' ? 'Disable Provider' : 'Enable Provider'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
