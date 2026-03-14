"use client"

import { useState } from "react"
import useSWR from "swr"
import { api } from "@/lib/api"
import { ShoppingCart, Plus, DollarSign, Users } from "lucide-react"

interface SaleRecord {
  id: number
  customer_name: string | null
  phone: string | null
  product: string | null
  product_id: number | null
  quantity: number
  price: number
  discount: number
  final_price: number
  created_at: string | null
}

interface Product {
  id: number
  name: string
  price: number
  discount: number
}

interface SaleForm {
  customer_name: string
  phone: string
  product_id: string
  quantity: string
  price: string
  discount: string
}

const EMPTY_FORM: SaleForm = { customer_name: "", phone: "", product_id: "", quantity: "1", price: "0", discount: "0" }

export default function SalesPage() {
  const { data: sales = [], mutate } = useSWR<SaleRecord[]>("/api/sales", api.fetcher)
  const { data: products = [] } = useSWR<Product[]>("/api/products", api.fetcher)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<SaleForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const openModal = () => { setForm(EMPTY_FORM); setError(""); setModal(true) }

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pid = parseInt(e.target.value)
    const product = products.find(p => p.id === pid)
    setForm(f => ({
      ...f,
      product_id: e.target.value,
      price: product ? String(product.price) : f.price,
      discount: product ? String(product.discount) : f.discount,
    }))
  }

  const computedFinal = (() => {
    const p = parseFloat(form.price) || 0
    const d = parseFloat(form.discount) || 0
    const q = parseInt(form.quantity) || 1
    return ((p - p * d / 100) * q).toFixed(2)
  })()

  const handleSave = async () => {
    setSaving(true); setError("")
    try {
      await api.post("/api/sales", {
        customer_name: form.customer_name || null,
        phone: form.phone || null,
        product_id: form.product_id ? parseInt(form.product_id) : null,
        quantity: parseInt(form.quantity) || 1,
        price: parseFloat(form.price) || 0,
        discount: parseFloat(form.discount) || 0,
      })
      await mutate()
      setModal(false)
    } catch (e: any) { setError(e.message || "Failed to save") }
    finally { setSaving(false) }
  }

  const totalRevenue = sales.reduce((s, r) => s + (r.final_price || 0), 0)
  const uniqueCustomers = new Set(sales.map(r => r.phone || r.customer_name).filter(Boolean)).size

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales</h1>
          <p className="text-muted-foreground">Transaction history and sales records.</p>
        </div>
        <button onClick={openModal} className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-2.5 px-5 rounded-xl hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Record Sale
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-emerald-400" },
          { label: "Total Transactions", value: sales.length, icon: ShoppingCart, color: "text-indigo-400" },
          { label: "Unique Customers", value: uniqueCustomers, icon: Users, color: "text-violet-400" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Customer", "Phone", "Product", "Qty", "Price", "Discount", "Final Price", "Date"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No sales recorded yet.</td></tr>
              )}
              {sales.map(s => (
                <tr key={s.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{s.customer_name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.phone || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.product || "—"}</td>
                  <td className="px-4 py-3 text-foreground">{s.quantity}</td>
                  <td className="px-4 py-3 text-foreground">${(s.price || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.discount > 0 ? `${s.discount}%` : "—"}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-400">${(s.final_price || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Sale Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-foreground mb-5">Record Sale</h2>
            {error && <div className="bg-rose-500/10 text-rose-400 text-sm p-3 rounded-lg mb-4 border border-rose-500/20">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Customer Name</label>
                <input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                  placeholder="John Doe" className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary text-foreground" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+1 234 567 8900" className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary text-foreground" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Product</label>
                <select value={form.product_id} onChange={handleProductSelect}
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary text-foreground">
                  <option value="">— Manual entry —</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Qty</label>
                  <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                    className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary text-foreground" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Price ($)</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary text-foreground" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Disc. %</label>
                  <input type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                    className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary text-foreground" />
                </div>
              </div>
              <div className="bg-muted/30 rounded-xl px-4 py-3 text-sm">
                Final price: <span className="font-bold text-emerald-400">${computedFinal}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50">
                {saving ? "Saving..." : "Record Sale"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
