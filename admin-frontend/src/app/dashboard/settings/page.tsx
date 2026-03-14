"use client"

import { useState, useEffect } from "react"
import { Lock, CheckCircle, AlertCircle, Bot, Save, Calendar, Clock, Trash2 } from "lucide-react"
import { api } from "@/lib/api"

export default function SettingsPage() {
  const [userRole, setUserRole] = useState<string | null>(null)
  
  // ── Password state ──────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdSuccess, setPwdSuccess] = useState("")
  const [pwdError, setPwdError] = useState("")

  // ── AI Rules state ────────────────────────────────────────────────────
  const [aiRules, setAiRules] = useState("")
  const [rulesLoading, setRulesLoading] = useState(false)
  const [rulesSaving, setRulesSaving] = useState(false)
  const [rulesSuccess, setRulesSuccess] = useState("")
  const [rulesError, setRulesError] = useState("")

  // ── Booking state ────────────────────────────────────────────────────
  const [bookingConfig, setBookingConfig] = useState<any>(null)
  const [configLoading, setConfigLoading] = useState(false)
  const [configSaving, setConfigSaving] = useState(false)
  const [bufferAfter, setBufferAfter] = useState(0)
  const [newBreak, setNewBreak] = useState({ start: "13:00", end: "14:00", label: "Lunch" })
  const [newClosedDay, setNewClosedDay] = useState({ date: "", reason: "" })

  const fetchBookingConfig = async () => {
    setConfigLoading(true)
    try {
      const data = await api.get("/api/bookings/config")
      setBookingConfig(data)
      setBufferAfter(data.buffer_after || 0)
    } catch (err: any) {
      setRulesError(err.message || "Failed to load booking config.")
    } finally {
      setConfigLoading(false)
    }
  }

  useEffect(() => {
    api.get("/api/auth/session").then((session: any) => {
      setUserRole(session.role)
      if (session.role === "BUSINESS_ADMIN") {
        setRulesLoading(true)
        api.get("/api/businesses/my")
          .then((biz: any) => setAiRules(biz.ai_rules || ""))
          .catch(() => setRulesError("Failed to load business settings."))
          .finally(() => setRulesLoading(false))
        
        fetchBookingConfig()
      }
    }).catch(() => {})
  }, [])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdError("")
    setPwdSuccess("")
    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match.")
      return
    }
    setPwdLoading(true)
    try {
      await api.post("/api/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      })
      setPwdSuccess("Password changed successfully.")
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
    } catch (err: any) {
      setPwdError(err.message || "Failed to change password.")
    } finally {
      setPwdLoading(false)
    }
  }

  const handleRulesSave = async () => {
    setRulesError(""); setRulesSuccess(""); setRulesSaving(true)
    try {
      await api.patch("/api/businesses/my/rules", { ai_rules: aiRules })
      setRulesSuccess("AI rules saved.")
    } catch (err: any) {
      setRulesError(err.message || "Failed to save rules.")
    } finally {
      setRulesSaving(false)
    }
  }

  const handleSaveSlotConfig = async () => {
    setConfigSaving(true)
    try {
      await api.patch("/api/bookings/config", { buffer_after: bufferAfter })
      setRulesSuccess("Booking configuration saved.")
      fetchBookingConfig()
    } catch (err: any) {
      setRulesError(err.message || "Failed to save configuration.")
    } finally {
      setConfigSaving(false)
    }
  }

  const handleAddBreak = async () => {
    try {
      await api.post("/api/bookings/config/breaks", {
        start_time: newBreak.start,
        end_time: newBreak.end,
        label: newBreak.label
      })
      fetchBookingConfig()
    } catch (err: any) {
      setRulesError(err.message || "Failed to add break.")
    }
  }

  const handleDeleteBreak = async (id: number) => {
    try {
      await api.delete(`/api/bookings/config/breaks/${id}`)
      fetchBookingConfig()
    } catch (err: any) {
      setRulesError(err.message || "Failed to delete break.")
    }
  }

  const handleAddClosedDay = async () => {
    try {
      await api.post("/api/bookings/config/closed-days", {
        date: newClosedDay.date,
        reason: newClosedDay.reason
      })
      setNewClosedDay({ date: "", reason: "" })
      fetchBookingConfig()
    } catch (err: any) {
      setRulesError(err.message || "Failed to add holiday.")
    }
  }

  const handleDeleteClosedDay = async (id: number) => {
    try {
      await api.delete(`/api/bookings/config/closed-days/${id}`)
      fetchBookingConfig()
    } catch (err: any) {
      setRulesError(err.message || "Failed to remove holiday.")
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and booking configuration.</p>
      </div>

      {(rulesSuccess || pwdSuccess) && (
        <div className="bg-emerald-500/10 text-emerald-500 text-sm p-4 rounded-xl border border-emerald-500/20 flex items-center gap-2 max-w-2xl">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{rulesSuccess || pwdSuccess}</span>
        </div>
      )}
      {(rulesError || pwdError) && (
        <div className="bg-rose-500/10 text-rose-500 text-sm p-4 rounded-xl border border-rose-500/20 flex items-center gap-2 max-w-2xl">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{rulesError || pwdError}</span>
        </div>
      )}

      <div className="max-w-2xl space-y-6">

        {/* ── Booking Settings ─────────────────────── */}
        {userRole === "BUSINESS_ADMIN" && (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Booking & Availability</h3>
                  <p className="text-xs text-muted-foreground">Control your calendar and time slots</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-10">
              {/* Buffer */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-primary" />
                  Time Buffer
                </div>
                <div className="flex gap-3">
                  <select
                    value={bufferAfter}
                    onChange={e => setBufferAfter(parseInt(e.target.value))}
                    className="bg-background border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary flex-1 appearance-none"
                  >
                    <option value={0}>No buffer</option>
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                  </select>
                  <button
                    onClick={handleSaveSlotConfig}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-sm"
                  >
                    {configSaving ? "..." : "Save"}
                  </button>
                </div>
                <p className="text-[12px] text-muted-foreground italic">Gap added after each booking to prevent overlap.</p>
              </div>

              {/* Breaks */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-primary" />
                  Daily Breaks
                </div>
                <div className="space-y-3">
                  {bookingConfig?.breaks?.map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between bg-card p-4 rounded-xl border border-border group hover:border-primary/30 transition-colors shadow-sm">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-sm">{b.label}</span>
                        <span className="text-xs text-muted-foreground">{b.start} — {b.end}</span>
                      </div>
                      <button onClick={() => handleDeleteBreak(b.id)} className="text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <input type="time" value={newBreak.start} onChange={e => setNewBreak({...newBreak, start: e.target.value})} className="bg-muted/30 border border-border rounded-lg p-2 text-xs w-24" />
                    <input type="time" value={newBreak.end} onChange={e => setNewBreak({...newBreak, end: e.target.value})} className="bg-muted/30 border border-border rounded-lg p-2 text-xs w-24" />
                    <input type="text" placeholder="Label (e.g. Lunch)" value={newBreak.label} onChange={e => setNewBreak({...newBreak, label: e.target.value})} className="bg-muted/30 border border-border rounded-lg p-2 text-xs flex-1 min-w-[100px]" />
                    <button onClick={handleAddBreak} className="bg-foreground text-background px-4 py-2 rounded-lg text-xs font-bold hover:opacity-80 transition-opacity">Add</button>
                  </div>
                </div>
              </div>

              {/* Holidays */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-primary" />
                  Closed Days
                </div>
                <div className="space-y-3">
                  {bookingConfig?.closed_days?.map((cd: any) => (
                    <div key={cd.id} className="flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
                      <div className="flex flex-col">
                         <span className="font-bold text-foreground text-sm">{cd.date}</span>
                         <span className="text-xs text-muted-foreground">{cd.reason || "Store closed"}</span>
                      </div>
                      <button onClick={() => handleDeleteClosedDay(cd.id)} className="text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <input type="date" value={newClosedDay.date} onChange={e => setNewClosedDay({...newClosedDay, date: e.target.value})} className="bg-muted/30 border border-border rounded-lg p-2 text-xs flex-1" />
                    <input type="text" placeholder="Reason (Optional)" value={newClosedDay.reason} onChange={e => setNewClosedDay({...newClosedDay, reason: e.target.value})} className="bg-muted/30 border border-border rounded-lg p-2 text-xs flex-1" />
                    <button onClick={handleAddClosedDay} className="bg-foreground text-background px-4 py-2 rounded-lg text-xs font-bold">Add</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── AI Rules ──────────────────────────────── */}
        {userRole === "BUSINESS_ADMIN" && (
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">AI Business Rules</h3>
                <p className="text-xs text-muted-foreground">Custom instructions your bot follows</p>
              </div>
            </div>

            <div className="space-y-4">
               <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-4 py-3 font-mono leading-relaxed border border-border/50">
                <span className="text-violet-500 font-bold">[GLOBAL RULES]</span> apply automatically to all businesses.<br />
                <span className="text-violet-500 font-bold">[BUSINESS RULES]</span> below are your custom overrides.
              </div>
              <textarea
                value={aiRules}
                onChange={e => setAiRules(e.target.value)}
                disabled={rulesLoading}
                rows={8}
                placeholder="Example: Always speak in English. Offer 10% discount to first-time callers."
                className="w-full bg-background border border-border rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-primary text-foreground font-mono resize-none disabled:opacity-50 transition-all"
              />
              <button
                onClick={handleRulesSave}
                disabled={rulesSaving || rulesLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-3 px-8 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
              >
                {rulesSaving ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {rulesSaving ? "Saving..." : "Save Rules"}
              </button>
            </div>
          </div>
        )}

        {/* ── Change Password ─────────────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Change Password</h3>
              <p className="text-xs text-muted-foreground">Update your account security</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
              className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary text-foreground"
              placeholder="Current Password"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary text-foreground"
                placeholder="New Password"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary text-foreground"
                placeholder="Confirm New"
              />
            </div>
            <button
              type="submit"
              disabled={pwdLoading}
              className="w-full bg-foreground text-background font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {pwdLoading ? "Processing..." : "Update Password"}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
