"use client"

import { useState, useEffect } from "react"
import { Lock, CheckCircle, AlertCircle, Bot, Save } from "lucide-react"
import { api } from "@/lib/api"

export default function SettingsPage() {
  // ── Password change ──────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdSuccess, setPwdSuccess] = useState("")
  const [pwdError, setPwdError] = useState("")

  // ── AI Rules (BUSINESS_ADMIN only) ────────────────────────────────────
  const [userRole, setUserRole] = useState<string | null>(null)
  const [aiRules, setAiRules] = useState("")
  const [rulesLoading, setRulesLoading] = useState(false)
  const [rulesSaving, setRulesSaving] = useState(false)
  const [rulesSuccess, setRulesSuccess] = useState("")
  const [rulesError, setRulesError] = useState("")

  useEffect(() => {
    api.get("/api/auth/session").then((session: any) => {
      setUserRole(session.role)
      if (session.role === "BUSINESS_ADMIN") {
        setRulesLoading(true)
        api.get("/api/businesses/my")
          .then((biz: any) => setAiRules(biz.ai_rules || ""))
          .catch(() => setRulesError("Failed to load business settings."))
          .finally(() => setRulesLoading(false))
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
    if (newPassword.length < 6) {
      setPwdError("New password must be at least 6 characters.")
      return
    }

    setPwdLoading(true)
    try {
      await api.post("/api/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      })
      setPwdSuccess("Password changed successfully.")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      setPwdError(err.message || "Failed to change password.")
    } finally {
      setPwdLoading(false)
    }
  }

  const handleRulesSave = async () => {
    setRulesError("")
    setRulesSuccess("")
    setRulesSaving(true)
    try {
      await api.patch("/api/businesses/my/rules", { ai_rules: aiRules })
      setRulesSuccess("AI rules saved.")
    } catch (err: any) {
      setRulesError(err.message || "Failed to save rules.")
    } finally {
      setRulesSaving(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and bot configuration.</p>
      </div>

      <div className="max-w-2xl space-y-6">

        {/* ── AI Rules (BUSINESS_ADMIN only) ──────────────────────────────── */}
        {userRole === "BUSINESS_ADMIN" && (
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">AI Business Rules</h3>
                <p className="text-xs text-muted-foreground">
                  Custom instructions your bot follows when replying to clients
                </p>
              </div>
            </div>

            {rulesSuccess && (
              <div className="bg-emerald-500/10 text-emerald-500 text-sm p-3 rounded-lg mb-4 border border-emerald-500/20 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {rulesSuccess}
              </div>
            )}
            {rulesError && (
              <div className="bg-rose-500/10 text-rose-500 text-sm p-3 rounded-lg mb-4 border border-rose-500/20 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {rulesError}
              </div>
            )}

            <div className="space-y-3">
              <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 font-mono leading-relaxed">
                <span className="text-violet-400 font-semibold">[PLATFORM RULES]</span> are applied automatically.<br />
                <span className="text-violet-400 font-semibold">[BUSINESS RULES]</span> below override or extend them for your business only.
              </div>
              <textarea
                value={aiRules}
                onChange={e => setAiRules(e.target.value)}
                disabled={rulesLoading}
                rows={8}
                placeholder={
                  "Examples:\n" +
                  "- Always greet clients by name if known.\n" +
                  "- Only discuss services listed on our website.\n" +
                  "- Never mention competitor pricing.\n" +
                  "- Escalate complaints to a human agent."
                }
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground font-mono resize-none disabled:opacity-50"
              />
              <button
                onClick={handleRulesSave}
                disabled={rulesSaving || rulesLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold py-2.5 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {rulesSaving
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Save className="w-4 h-4" />
                }
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
              <p className="text-xs text-muted-foreground">Update your admin account password</p>
            </div>
          </div>

          {pwdSuccess && (
            <div className="bg-emerald-500/10 text-emerald-500 text-sm p-3 rounded-lg mb-4 border border-emerald-500/20 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {pwdSuccess}
            </div>
          )}
          {pwdError && (
            <div className="bg-rose-500/10 text-rose-500 text-sm p-3 rounded-lg mb-4 border border-rose-500/20 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {pwdError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                placeholder="Min. 6 characters"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={pwdLoading}
              className="w-full mt-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {pwdLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {pwdLoading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
