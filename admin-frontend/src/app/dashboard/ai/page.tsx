"use client"

import { Cpu, Key, Plus, Loader2, X, AlertCircle, Pencil } from "lucide-react"
import useSWR, { mutate } from "swr"
import { api } from "@/lib/api"
import { useAuth } from "@/components/auth-provider"
import { useState, useEffect } from "react"

interface AIProvider {
  id: number
  name: string
  provider: "anthropic" | "openai" | "gemini"
  api_key: string
  model: string | null
  is_active: boolean
}

const PROVIDER_META: Record<string, { label: string; color: string; defaultModel: string }> = {
  anthropic: { label: "Anthropic Claude", color: "from-amber-400 to-orange-500",  defaultModel: "claude-haiku-4-5-20251001" },
  openai:    { label: "OpenAI GPT",        color: "from-emerald-400 to-teal-500",  defaultModel: "gpt-4o-mini" },
  gemini:    { label: "Google Gemini",     color: "from-blue-400 to-indigo-500",   defaultModel: "gemini-1.5-flash" },
}

const inputCls = "w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground transition-all"

// ── Add / Edit modal ─────────────────────────────────────────────────────────
function ProviderModal({
  initial,
  onClose,
  onSuccess,
}: {
  initial?: AIProvider
  onClose: () => void
  onSuccess: () => void
}) {
  const isEdit = !!initial
  const [name, setName]         = useState(initial?.name ?? "")
  const [provider, setProvider] = useState(initial?.provider ?? "anthropic")
  const [apiKey, setApiKey]     = useState("")          // never pre-fill existing key
  const [model, setModel]       = useState(initial?.model ?? "")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const payload: Record<string, unknown> = { name, provider, model: model || null }
      // Only send api_key if a new one was typed
      if (apiKey.trim()) payload.api_key = apiKey.trim()

      if (isEdit) {
        await api.patch(`/api/ai-providers/${initial!.id}`, payload)
      } else {
        if (!apiKey.trim()) { setError("API Key is required"); setLoading(false); return }
        await api.post("/api/ai-providers", { ...payload, api_key: apiKey.trim(), is_active: true })
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to save provider")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">{isEdit ? "Edit Provider" : "Add AI Provider"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        {error && (
          <div className="bg-rose-500/10 text-rose-500 text-sm p-3 rounded-lg mb-4 border border-rose-500/20 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Display Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required className={inputCls}
              placeholder="e.g. Dentist Claude, Premium GPT" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Provider *</label>
            <select value={provider} onChange={e => setProvider(e.target.value as any)}
              className={`${inputCls} cursor-pointer appearance-none`}>
              <option value="anthropic">Anthropic Claude</option>
              <option value="openai">OpenAI GPT</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              API Key {isEdit ? <span className="text-muted-foreground font-normal">(leave blank to keep current)</span> : "*"}
            </label>
            <input value={apiKey} onChange={e => setApiKey(e.target.value)} type="password"
              required={!isEdit} className={`${inputCls} font-mono`}
              placeholder={isEdit ? "••••••••  (unchanged)" : "sk-ant-... / sk-... / AIza..."} />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Model <span className="text-muted-foreground font-normal">(optional — uses default if blank)</span>
            </label>
            <input value={model} onChange={e => setModel(e.target.value)} className={inputCls}
              placeholder={PROVIDER_META[provider]?.defaultModel ?? ""} />
          </div>

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted text-sm font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Provider"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AISettingsPage() {
  const { data: providers, isLoading } = useSWR<AIProvider[]>("/api/ai-providers", api.fetcher)
  const { data: platformSettings, mutate: refreshSettings } = useSWR<{ global_ai_rules: string }>("/api/platform-settings", api.fetcher)
  
  const { session, loading: authLoading } = useAuth()
  const [actionId, setActionId]           = useState<number | null>(null)
  const [showAdd, setShowAdd]             = useState(false)
  const [editing, setEditing]             = useState<AIProvider | null>(null)
  
  const [globalRules, setGlobalRules] = useState<string>("")
  const [isSavingRules, setIsSavingRules] = useState(false)
  const [isEditingRules, setIsEditingRules] = useState(false)

  // Sync state when data loads
  useEffect(() => {
    if (platformSettings) setGlobalRules(platformSettings.global_ai_rules)
  }, [platformSettings])

  if (authLoading) return <div className="min-h-screen bg-background" />
  if (!session || session.role !== "SUPER_ADMIN") return null

  const refresh = () => mutate("/api/ai-providers")

  const handleToggle = async (p: AIProvider) => {
    setActionId(p.id)
    try {
      await api.patch(`/api/ai-providers/${p.id}`, { is_active: !p.is_active })
      refresh()
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (p: AIProvider) => {
    if (!confirm(`Delete "${p.name}"? Businesses using this engine will lose their AI connection.`)) return
    setActionId(p.id)
    try {
      await api.delete(`/api/ai-providers/${p.id}`)
      refresh()
    } finally {
      setActionId(null)
    }
  }

  const handleSaveGlobalRules = async () => {
    setIsSavingRules(true)
    try {
      await api.patch("/api/platform-settings", { global_ai_rules: globalRules })
      refreshSettings()
      setIsEditingRules(false)
    } catch (err: any) {
      alert(err.message || "Failed to save global rules")
    } finally {
      setIsSavingRules(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {showAdd && <ProviderModal onClose={() => setShowAdd(false)} onSuccess={refresh} />}
      {editing  && <ProviderModal initial={editing} onClose={() => setEditing(null)} onSuccess={refresh} />}

      {/* Global Context Section */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-foreground">Global AI Rules</h2>
          <p className="text-sm text-muted-foreground mt-1">
            These rules are applied to <b>every</b> AI response across all businesses on the platform.
            Use this to enforce platform-wide safety flags, tone, or format requirements.
          </p>
        </div>
        
        <textarea 
          value={globalRules}
          onChange={(e) => setGlobalRules(e.target.value)}
          disabled={!isEditingRules || isSavingRules}
          className={`w-full h-32 border border-border rounded-xl p-4 text-sm font-mono focus:ring-1 focus:ring-primary outline-none transition-all resize-none ${
            !isEditingRules 
              ? "bg-muted/50 text-muted-foreground opacity-80 cursor-not-allowed" 
              : "bg-background text-foreground"
          }`}
          placeholder="e.g. Always be professional. Do not provide medical advice. Return prices in USD."
        />
        <div className="mt-4 flex justify-end gap-3">
          <button 
            onClick={() => setIsEditingRules(true)}
            disabled={isEditingRules || isSavingRules}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
              isEditingRules || isSavingRules
                ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
            }`}
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button 
            onClick={handleSaveGlobalRules}
            disabled={!isEditingRules || isSavingRules}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
               !isEditingRules || isSavingRules
                ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 shadow-sm"
            }`}
          >
            {isSavingRules && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSavingRules ? "Saving..." : "Save Global Rules"}
          </button>
        </div>
      </div>

      <div className="flex justify-between items-end mt-12">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Engine Registry</h1>
          <p className="text-muted-foreground">Manage global AI providers. Businesses reference these engines by name.</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Provider
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !providers || providers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4 text-muted-foreground border border-dashed border-border rounded-2xl">
          <Cpu className="w-12 h-12 opacity-30" />
          <p className="text-sm font-medium">No AI providers configured yet.</p>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Add your first provider
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {providers.map((p) => {
            const meta = PROVIDER_META[p.provider] ?? PROVIDER_META.anthropic
            return (
              <div key={p.id}
                className={`bg-card border rounded-xl overflow-hidden shadow-sm transition-all ${
                  p.is_active ? "border-border hover:border-primary/40" : "border-border/40 opacity-60"
                } ${actionId === p.id ? "pointer-events-none opacity-50" : ""}`}>

                {/* colour bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${meta.color}`} />

                <div className="p-5 space-y-4">
                  {/* header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-primary shrink-0" /> {p.name}
                      </h3>
                      <span className="text-xs text-muted-foreground font-mono mt-0.5 block">{meta.label}</span>
                      {p.model && <span className="text-xs text-primary font-mono">{p.model}</span>}
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full shrink-0 ${
                      p.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-400"
                    }`}>
                      {p.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>

                  {/* masked key */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                      <Key className="w-3 h-3" /> API Key
                    </label>
                    <div className="bg-muted/50 border border-border rounded-lg py-2 px-3 text-sm font-mono text-muted-foreground tracking-widest">
                      ••••••••••••••••••••
                    </div>
                  </div>

                  {/* actions */}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setEditing(p)}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors flex items-center justify-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => handleToggle(p)} disabled={actionId === p.id}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                        p.is_active
                          ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                      }`}>
                      {actionId === p.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {p.is_active ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => handleDelete(p)} disabled={actionId === p.id}
                      className="px-3 py-2 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

