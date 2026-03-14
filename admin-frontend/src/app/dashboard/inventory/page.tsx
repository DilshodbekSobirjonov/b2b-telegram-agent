"use client"

import { useState } from "react"
import useSWR from "swr"
import { api } from "@/lib/api"
import { Package, Plus, Pencil, Trash2, AlertTriangle, TrendingUp } from "lucide-react"

interface Product {
  id: number
  name: string
  category: string | null
  price: number
  quantity: number
  discount: number
  active: boolean
  created_at: string | null
}

interface ProductForm {
  name: string
  category: string
  price: string
  quantity: string
  discount: string
  active: boolean
}

const EMPTY_FORM: ProductForm = { name: "", category: "", price: "0", quantity: "0", discount: "0", active: true }

export default function InventoryPage() {
  const { data: products = [], mutate } = useSWR<Product[]>("/api/products", api.fetcher)
  const [modal, setModal] = useState<{ open: boolean; editing: Product | null }>({ open: false, editing: null })
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const openAdd = () => { setForm(EMPTY_FORM); setError(""); setModal({ open: true, editing: null }) }
  const openEdit = (p: Product) => {
    setForm({ name: p.name, category: p.category || "", price: String(p.price), quantity: String(p.quantity), discount: String(p.discount), active: p.active })
    setError("")
    setModal({ open: true, editing: p })
  }
  const closeModal = () => setModal({ open: false, editing: null })

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Product name is required"); return }
    setSaving(true); setError("")
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category || null,
        price: parseFloat(form.price) || 0,
        quantity: parseInt(form.quantity) || 0,
        discount: parseFloat(form.discount) || 0,
        active: form.active,
      }
      if (modal.editing) {
        await api.patch(`/api/products/${modal.editing.id}`, payload)
      } else {
        await api.post("/api/products", payload)
      }
      await mutate()
      closeModal()
    } catch (e: any) { setError(e.message || "Failed to save") }
    finally { setSaving(false) }
  }

  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return
    try { await api.delete(`/api/products/${p.id}`); await mutate() }
    catch (e: any) { alert(e.message || "Failed to delete") }
  }

  const totalValue = products.reduce((s, p) => s + (p.price * p.quantity), 0)
  const inStock    = products.filter(p => p.quantity > 0).length
  const lowStock   = products.filter(p => p.quantity > 0 && p.quantity <= 5).length

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground">Manage your product catalog and stock levels.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-2.5 px-5 rounded-xl hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: products.length, icon: Package, color: "text-indigo-400" },
          { label: "In Stock", value: inStock, icon: TrendingUp, color: "text-emerald-400" },
          { label: "Low Stock", value: lowStock, icon: AlertTriangle, color: "text-amber-400" },
          { label: "Total Value", value: `$${totalValue.toFixed(2)}`, icon: TrendingUp, color: "text-violet-400" },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Name", "Category", "Price", "Stock", "Discount", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No products yet. Add your first product.</td></tr>
              )}
              {products.map(p => (
                <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category || "—"}</td>
                  <td className="px-4 py-3 text-foreground">${p.price.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${p.quantity === 0 ? "text-rose-400" : p.quantity <= 5 ? "text-amber-400" : "text-foreground"}`}>{p.quantity}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.discount > 0 ? `${p.discount}%` : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.active ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-muted-foreground hover:text-indigo-400 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(p)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-foreground mb-5">{modal.editing ? "Edit Product" : "Add Product"}</h2>
            {error && <div className="bg-rose-500/10 text-rose-400 text-sm p-3 rounded-lg mb-4 border border-rose-500/20">{error}</div>}
            <div className="space-y-4">
              {[
                { label: "Product Name *", key: "name", type: "text", placeholder: "e.g. Premium Plan" },
                { label: "Category", key: "category", type: "text", placeholder: "e.g. Software" },
                { label: "Price ($)", key: "price", type: "number", placeholder: "0.00" },
                { label: "Stock Quantity", key: "quantity", type: "number", placeholder: "0" },
                { label: "Discount (%)", key: "discount", type: "number", placeholder: "0" },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-sm font-medium text-foreground block mb-1.5">{field.label}</label>
                  <input
                    type={field.type}
                    value={(form as any)[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
              ))}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.active ? "bg-emerald-500" : "bg-muted"}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.active ? "translate-x-5" : ""}`} />
                </div>
                <span className="text-sm font-medium text-foreground">Active</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
