"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { api } from "@/lib/api"
import { useAuth } from "@/components/auth-provider"
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
  const [workingHours, setWorkingHours] = useState("09:00-18:00")
  const [timezone, setTimezone] = useState("UTC")
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
        telegram_token: token,
        working_hours: workingHours,
        timezone: timezone
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
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto font-sans">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Add New Business</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/10 text-rose-500 text-sm p-3 rounded-lg mb-4 border border-rose-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Business Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground transition-all"
              placeholder="e.g. Acme Dental" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Admin Login *</label>
              <input value={login} onChange={e => setLogin(e.target.value)} required
                className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary text-foreground transition-all"
                placeholder="biz_admin" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Admin Password *</label>
              <input value={password} type="password" onChange={e => setPassword(e.target.value)} required
                className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary text-foreground transition-all"
                placeholder="••••••••" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">AI Provider *</label>
            <select value={aiProvider} onChange={e => setAiProvider(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary text-foreground transition-all appearance-none cursor-pointer">
              <option value="anthropic">Anthropic Claude</option>
              <option value="openai">OpenAI GPT-4</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Telegram Bot Token *</label>
            <input value={token} onChange={e => setToken(e.target.value)} required
              className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary text-foreground font-mono transition-all"
              placeholder="7123456789:AAF..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Working Hours *</label>
              <input value={workingHours} onChange={e => setWorkingHours(e.target.value)} required
                className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary text-foreground transition-all"
                placeholder="09:00-18:00" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Timezone *</label>
              <input value={timezone} onChange={e => setTimezone(e.target.value)} required
                className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary text-foreground transition-all"
                placeholder="UTC" />
            </div>
          </div>
          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted text-sm font-medium transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Creating..." : "Create Business"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function BusinessesPage() {
  const { data: businesses, isLoading, error } = useSWR<Business[]>('/api/businesses', api.fetcher)
  const { session, loading: authLoading } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [actionId, setActionId] = useState<number | null>(null)

  if (authLoading) return <div className="min-h-screen bg-background" />
  if (!session || session.role !== 'SUPER_ADMIN') return null

  const handleDisableToggle = async (biz: Business) => {
    setActionId(biz.id)
    try {
      const newStatus = biz.status === "active" ? "disabled" : "active"
      await api.patch(`/api/businesses/${biz.id}`, { subscription_status: newStatus })
      mutate('/api/businesses')
    } catch (err: any) {
      alert(err.message || "Failed to update status")
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (biz: Business) => {
    if (!confirm(`Are you sure you want to delete "${biz.name}"? All associated data will be removed.`)) return
    setActionId(biz.id)
    try {
      await api.delete(`/api/businesses/${biz.id}`)
      mutate('/api/businesses')
    } catch (err: any) {
      alert(err.message || "Failed to delete business")
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {showModal && (
        <AddBusinessModal onClose={() => setShowModal(false)} onSuccess={() => mutate('/api/businesses')} />
      )}

      <div className="flex justify-between items-center bg-card/30 p-6 rounded-2xl border border-border/50 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Businesses</h1>
          <p className="text-muted-foreground mt-1">Manage tenant companies and their assistant configurations.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add New Business
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-5">BUSINESS</th>
                <th className="px-6 py-5">STATUS & FEATURES</th>
                <th className="px-6 py-5">PLAN</th>
                <th className="px-6 py-5">NEXT BILLING</th>
                <th className="px-6 py-5 text-right">CLIENTS</th>
                <th className="px-6 py-5 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-24 text-center text-muted-foreground bg-card/20">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                    <p className="font-medium">Fetching business registry...</p>
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-rose-500 bg-rose-500/5">
                    <AlertCircle className="w-8 h-8 mx-auto mb-3" />
                    <p className="font-bold">Error loading registry</p>
                    <p className="text-xs opacity-80 mt-1">Please ensure the backend API gateway is online.</p>
                  </td>
                </tr>
              )}
              {businesses?.map((biz) => (
                <tr key={biz.id} className={`hover:bg-muted/30 transition-all group ${actionId === biz.id ? 'opacity-50 pointer-events-none' : ''}`}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/80 to-purple-600/80 p-[1px] shadow-inner">
                        <div className="w-full h-full rounded-[15px] bg-card/90 flex items-center justify-center text-indigo-500">
                          <Building2 className="w-6 h-6" />
                        </div>
                      </div>
                      <div>
                        <span className="font-bold text-foreground text-base">{biz.name}</span>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">UUID: {biz.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-2">
                      <span className={`inline-flex items-center w-fit px-3 py-1 rounded-lg text-xs font-bold tracking-tight ${biz.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/15 text-slate-400 border border-slate-500/20'}`}>
                        {biz.status?.toUpperCase()}
                      </span>
                      {biz.aiEnabled && (
                        <div className="flex items-center gap-1.5 text-primary">
                          <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest">AI Agent Online</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-semibold text-foreground bg-muted/30 px-2 py-1 rounded-lg border border-border/40">{biz.plan}</span>
                  </td>
                  <td className="px-6 py-5 text-muted-foreground font-medium">{biz.nextPayment}</td>
                  <td className="px-6 py-5 text-right">
                    <span className="font-black text-foreground text-lg">{biz.clients.toLocaleString()}</span>
                    <span className="text-muted-foreground text-[10px] ml-1 uppercase font-bold">Base</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center gap-2 items-center opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                      <button
                        onClick={() => handleDisableToggle(biz)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${biz.status === 'active' ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/10' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/10'}`}
                        title={biz.status === 'active' ? 'Disable Business' : 'Activate Business'}
                      >
                        {biz.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(biz)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !error && businesses?.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-24 text-center bg-card/10">
                    <div className="flex flex-col items-center gap-4 opacity-40">
                      <Building2 className="w-12 h-12" />
                      <div className="space-y-1">
                        <p className="text-base font-bold text-foreground">No Businesses Registered</p>
                        <p className="text-sm">Click the "Add New Business" button to begin onboarding.</p>
                      </div>
                    </div>
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

function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  )
}
