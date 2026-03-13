"use client"

import { Cpu, Key, Activity, DollarSign, Plus, Loader2, X, AlertCircle } from "lucide-react"
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

function AddProviderModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [modelName, setModelName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await api.post("/api/ai-providers", { name, api_key: apiKey, model_name: modelName, is_active: true })
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to create provider")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Add AI Provider</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        {error && (
          <div className="bg-rose-500/10 text-rose-500 text-sm p-3 rounded-lg mb-4 border border-rose-500/20 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Provider Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
              placeholder="e.g. Anthropic Claude" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">API Key *</label>
            <input value={apiKey} onChange={e => setApiKey(e.target.value)} required type="password"
              className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground font-mono"
              placeholder="sk-ant-..." />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Model Name</label>
            <input value={modelName} onChange={e => setModelName(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
              placeholder="e.g. claude-3-5-sonnet" />
          </div>
          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted text-sm font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Adding..." : "Add Provider"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AISettingsPage() {
  const { data: providers, isLoading } = useSWR<AIProvider[]>('/api/ai-providers', api.fetcher)
  const { session } = useAuth()
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (session && session.role !== 'SUPER_ADMIN') {
      router.push('/dashboard')
    }
  }, [session, router])

  if (!session || session.role !== 'SUPER_ADMIN') return null

  const handleToggle = async (provider: AIProvider) => {
    setLoadingId(provider.id)
    try {
      await api.patch(`/api/ai-providers/${provider.id}`, { is_active: !provider.is_active })
      mutate('/api/ai-providers')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {showModal && (
        <AddProviderModal
          onClose={() => setShowModal(false)}
          onSuccess={() => mutate('/api/ai-providers')}
        />
      )}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Engine Configuration</h1>
          <p className="text-muted-foreground">Manage Large Language Model providers, API keys, and routing limits.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Add Provider
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !providers || providers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4 text-muted-foreground">
          <Cpu className="w-12 h-12 opacity-30" />
          <p className="text-sm">No AI providers configured yet.</p>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Add your first provider
          </button>
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
