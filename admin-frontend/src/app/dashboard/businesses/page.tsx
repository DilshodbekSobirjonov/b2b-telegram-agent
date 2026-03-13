"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { api } from "@/lib/api"
import { Building2, Settings2, Plus, LogIn, Trash2, X, Loader2 } from "lucide-react"

interface Business {
  id: number
  name: string
  status: string
  plan: string
  nextPayment: string
  clients: number
  aiEnabled: boolean
}

function AddBusinessModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("")
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [aiProvider, setAiProvider] = useState("anthropic")
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await api.post("/api/businesses", { 
        name, 
        login, 
        password, 
        ai_provider: aiProvider,
        telegram_token: token
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to create business")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Add New Business</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <p className="bg-rose-500/10 text-rose-500 text-sm p-3 rounded-lg mb-4 border border-rose-500/20">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Business Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
              placeholder="e.g. Acme Dental" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Admin Login *</label>
              <input value={login} onChange={e => setLogin(e.target.value)} required
                className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary text-foreground"
                placeholder="biz_admin" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Admin Password *</label>
              <input value={password} type="password" onChange={e => setPassword(e.target.value)} required
                className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary text-foreground"
                placeholder="••••••••" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">AI Provider *</label>
            <select value={aiProvider} onChange={e => setAiProvider(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary text-foreground">
              <option value="anthropic">Anthropic Claude</option>
              <option value="openai">OpenAI GPT-4</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Telegram Bot Token *</label>
            <input value={token} onChange={e => setToken(e.target.value)} required
              className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary text-foreground font-mono"
              placeholder="7123456789:AAF..." />
          </div>
          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted text-sm font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Creating..." : "Create Business"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import { useAuth } from "@/components/auth-provider"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function BusinessesPage() {
  const { data: businesses, isLoading, error } = useSWR<Business[]>('/api/businesses', api.fetcher)
  const { session } = useAuth()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [actionId, setActionId] = useState<number | null>(null)

  useEffect(() => {
    if (session && session.role !== 'SUPER_ADMIN') {
      router.push('/dashboard')
    }
  }, [session, router])

  if (!session || session.role !== 'SUPER_ADMIN') return null

  const handleDisableToggle = async (biz: Business) => {
    setActionId(biz.id)
    try {
      const newStatus = biz.status === "active" ? "disabled" : "active"
      await api.patch(`/api/businesses/${biz.id}`, { subscription_status: newStatus })
      mutate('/api/businesses')
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (biz: Business) => {
    if (!confirm(`Delete "${biz.name}"? This cannot be undone.`)) return
    setActionId(biz.id)
    try {
      await api.delete(`/api/businesses/${biz.id}`)
      mutate('/api/businesses')
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {showModal && (
        <AddBusinessModal onClose={() => setShowModal(false)} onSuccess={() => mutate('/api/businesses')} />
      )}

      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Businesses Management</h1>
          <p className="text-muted-foreground">Manage tenant companies and their bot configurations.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-2.5 px-6 rounded-xl shadow-md hover:opacity-90 transition-opacity flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Business
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Business Name</th>
                <th className="px-6 py-4">Status & AI</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Next Payment</th>
                <th className="px-6 py-4 text-right">Clients</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading businesses...
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-rose-500">
                    Failed to load businesses. Is the API server running?
                  </td>
                </tr>
              )}
              {businesses?.map((biz) => (
                <tr key={biz.id} className={`hover:bg-muted/30 transition-colors group ${actionId === biz.id ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">{biz.name}</span>
                        <p className="text-xs text-muted-foreground">ID: {biz.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-medium ${biz.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                        {biz.status?.toUpperCase()}
                      </span>
                      {biz.aiEnabled && <span className="text-[10px] text-primary font-bold uppercase tracking-wider">AI Enabled</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">{biz.plan}</td>
                  <td className="px-6 py-4 text-muted-foreground">{biz.nextPayment}</td>
                  <td className="px-6 py-4 text-right font-medium text-foreground">{biz.clients.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDisableToggle(biz)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${biz.status === 'active' ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'}`}
                        title={biz.status === 'active' ? 'Disable' : 'Enable'}
                      >
                        {biz.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDelete(biz)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Delete Business"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !error && businesses?.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No businesses yet. Click "Add Business" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
