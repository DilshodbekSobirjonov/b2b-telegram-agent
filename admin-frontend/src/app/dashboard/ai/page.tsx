"use client"

import { Cpu, Key, Activity, DollarSign, Plus, Loader2 } from "lucide-react"
import useSWR, { mutate } from "swr"
import { api } from "@/lib/api"
import { useAuth } from "@/components/auth-provider"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface AIProvider {
  id: number
  name: string
  api_key: string
  model_name: string
  is_active: boolean
}

export default function AISettingsPage() {
  const { data: providers, isLoading } = useSWR<AIProvider[]>('/api/ai_providers', api.fetcher)
  const { session } = useAuth()
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<number | null>(null)

  useEffect(() => {
    if (session && session.role !== 'SUPER_ADMIN') {
      router.push('/dashboard')
    }
  }, [session, router])

  if (!session || session.role !== 'SUPER_ADMIN') return null

  const handleToggle = async (provider: AIProvider) => {
    setLoadingId(provider.id)
    try {
      await api.patch(`/api/ai_providers/${provider.id}`, { is_active: !provider.is_active })
      mutate('/api/ai_providers')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Engine Configuration</h1>
          <p className="text-muted-foreground">Manage Large Language Model providers, API keys, and routing limits.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Provider
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {providers?.map((p) => (
            <div key={p.id} className={`bg-card border ${p.is_active ? 'border-border' : 'border-border/50 opacity-70'} rounded-xl overflow-hidden shadow-sm hover:border-primary/40 transition-all`}>
              
              <div className={`h-2 w-full bg-gradient-to-r ${p.name.toLowerCase().includes('anthropic') ? 'from-amber-400 to-orange-500' : p.name.toLowerCase().includes('openai') ? 'from-emerald-400 to-teal-500' : 'from-blue-400 to-indigo-500'}`} />
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Cpu className="w-5 h-5" /> {p.name}
                    </h3>
                    <p className="text-sm text-primary font-mono mt-1">{p.model_name}</p>
                  </div>
                  <div className={`px-3 py-1 text-xs font-bold rounded-full ${p.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                    {p.is_active ? "ACTIVE" : "INACTIVE"}
                  </div>
                </div>

                <div className="space-y-4">
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Key className="w-3 h-3" /> API Key
                    </label>
                    <input 
                      type="password" 
                      value={p.api_key ? "••••••••••••••••••••••••" : ""}
                      readOnly
                      className="w-full bg-muted/50 border border-border rounded-lg py-2 px-3 text-sm font-mono text-muted-foreground focus:outline-none"
                      placeholder="No key set"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-muted/30 p-3 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Activity className="w-3 h-3"/> Efficiency</div>
                      <div className="text-lg font-bold text-foreground">98.2%</div>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><DollarSign className="w-3 h-3"/> Est. Cost</div>
                      <div className="text-lg font-bold text-foreground">$0.00</div>
                    </div>
                  </div>

                </div>

                <div className="mt-6 pt-4 border-t border-border flex justify-end">
                  <button 
                    onClick={() => handleToggle(p)}
                    disabled={loadingId === p.id}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${p.is_active ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' : 'bg-primary text-white hover:bg-primary/90'}`}>
                    {loadingId === p.id && <Loader2 className="w-4 h-4 animate-spin" />}
                    {p.is_active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
