'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { FileText, Plus, Search, Trash2, Pencil, Download, X, PlusCircle, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { ClientSelectorWithAdd } from './client-selector-with-add'

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0)
}
function fmtDate(d: string) {
  if (!d) return '—'
  try { return new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return d }
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-secondary text-secondary-foreground',
  sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-zinc-200 text-zinc-700',
}
const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador', sent: 'Enviada', approved: 'Aprobada', rejected: 'Rechazada', cancelled: 'Cancelada',
}

interface QuotationItem {
  name: string
  description?: string
  quantity: number
  unitPrice: number
}

export function QuotationsModule() {
  const [quotations, setQuotations] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [q, p, c] = await Promise.all([
        fetch('/api/quotations').then(r => r.json()),
        fetch('/api/products').then(r => r.json()),
        fetch('/api/clients').then(r => r.json()),
      ])
      setQuotations(q.quotations || [])
      setProducts(p.products || [])
      setClients(c.clients || [])
    } catch (e: any) {
      toast.error('Error al cargar: ' + e.message)
    } finally {
      setLoading(false)
    }
  }
  useState(() => { load() })

  const filtered = quotations.filter((q) => {
    if (!search) return true
    const s = search.toLowerCase()
    return q.folio?.toLowerCase().includes(s) || q.client_name?.toLowerCase().includes(s)
  })

  function openNew() {
    setEditing(null)
    const today = new Date().toISOString().slice(0, 10)
    const valid = new Date(); valid.setDate(valid.getDate() + 15)
    setForm({
      date: today,
      valid_until: valid.toISOString().slice(0, 10),
      client_id: '',
      items: [] as QuotationItem[],
      discount: 0,
      iva_rate: 0.16,
      notes: '',
      payment_terms: '50% anticipo al confirmar. Saldo contra entrega.\nTransferencia o efectivo.',
      status: 'draft',
    })
    setDialogOpen(true)
  }

  function openEdit(q: any) {
    setEditing(q)
    setForm({
      id: q.id,
      folio: q.folio,
      date: q.date,
      valid_until: q.valid_until,
      client_id: q.client_id || '',
      items: q.items || [],
      discount: q.discount || 0,
      iva_rate: q.iva_rate ?? 0.16,
      notes: q.notes || '',
      payment_terms: q.payment_terms || '',
      status: q.status || 'draft',
    })
    setDialogOpen(true)
  }

  function addItem(p?: any) {
    const items = [...(form.items || [])]
    items.push({
      name: p?.name || '',
      description: p?.description || '',
      quantity: p ? 1 : 1,
      unitPrice: p?.price || 0,
    })
    setForm({ ...form, items })
  }

  function updateItem(i: number, key: string, value: any) {
    const items = [...(form.items || [])]
    items[i] = { ...items[i], [key]: value }
    setForm({ ...form, items })
  }

  function removeItem(i: number) {
    const items = [...(form.items || [])]
    items.splice(i, 1)
    setForm({ ...form, items })
  }

  function calc() {
    const subtotal = (form.items || []).reduce((s: number, it: QuotationItem) => s + (it.quantity * it.unitPrice), 0)
    const discount = form.discount || 0
    const base = subtotal - discount
    const iva = base * (form.iva_rate || 0)
    const total = base + iva
    return { subtotal, discount, iva, total }
  }

  async function save() {
    setSaving(true)
    try {
      const { subtotal, discount, iva, total } = calc()
      const payload = {
        ...form,
        subtotal, discount, iva, total,
      }
      const method = editing ? 'PUT' : 'POST'
      const r = await fetch('/api/quotations', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      if (!r.ok) throw new Error((await r.json()).error || 'Error')
      toast.success(editing ? 'Cotización actualizada' : 'Cotización creada')
      setDialogOpen(false)
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar esta cotización?')) return
    try {
      const r = await fetch(`/api/quotations?id=${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('Error')
      toast.success('Cotización eliminada')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  function downloadPDF(id: string) {
    window.open(`/api/quotations/pdf?id=${id}`, '_blank')
  }


  const totals = calc()

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por folio o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openNew} className="gold-gradient-bg text-white hover:opacity-90">
          <Plus className="h-4 w-4 mr-1" /> Nueva Cotización
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto scroll-area-thin">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60">
              <tr>
                <th className="text-left p-3 font-semibold">Folio</th>
                <th className="text-left p-3 font-semibold">Cliente</th>
                <th className="text-left p-3 font-semibold hidden md:table-cell">Fecha</th>
                <th className="text-right p-3 font-semibold">Total</th>
                <th className="text-center p-3 font-semibold">Estado</th>
                <th className="text-right p-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Cargando...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  No hay cotizaciones registradas
                </td></tr>
              )}
              {!loading && filtered.map((q) => (
                <tr key={q.id} className="border-t hover:bg-secondary/30">
                  <td className="p-3 font-mono text-xs font-medium">{q.folio}</td>
                  <td className="p-3">{q.client_name || '—'}</td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">{fmtDate(q.date)}</td>
                  <td className="p-3 text-right font-medium">{fmt(q.total)}</td>
                  <td className="p-3 text-center">
                    <Badge className={STATUS_STYLES[q.status] || STATUS_STYLES.draft}>
                      {STATUS_LABEL[q.status] || q.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => downloadPDF(q.id)} title="Descargar PDF">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(q)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(q.id)} className="text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto scroll-area-thin">
          <DialogHeader>
            <DialogTitle className="font-serif-display text-xl">
              {editing ? `Editar Cotización ${editing.folio || ''}` : 'Nueva Cotización'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Header info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Fecha</Label>
                <Input type="date" value={form.date || ''} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Vigencia</Label>
                <Input type="date" value={form.valid_until || ''} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
              </div>
              <ClientSelectorWithAdd
                label="Cliente"
                value={form.client_id || ''}
                onChange={(v) => setForm({ ...form, client_id: v })}
                clients={clients}
                onClientCreated={(c) => setClients((prev) => [...prev, c])}
              />
            </div>

            {/* Items */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-secondary/60 px-3 py-2 flex items-center justify-between">
                <span className="font-semibold text-sm">Artículos</span>
                <Select onValueChange={(v) => {
                  const p = products.find(x => x.id === v)
                  if (p) addItem(p)
                }}>
                  <SelectTrigger className="h-7 w-auto text-xs gap-1">
                    <PlusCircle className="h-3 w-3" />
                    <SelectValue placeholder="Agregar producto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} · {fmt(p.price)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="max-h-72 overflow-y-auto scroll-area-thin">
                {(form.items || []).length === 0 && (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    Sin artículos. Use el botón "Agregar producto" o agregue uno personalizado.
                  </div>
                )}
                {(form.items || []).map((it: any, i: number) => (
                  <div key={i} className="grid grid-cols-12 gap-2 p-2 border-t items-center">
                    <Input
                      className="col-span-12 md:col-span-5"
                      placeholder="Nombre del artículo"
                      value={it.name}
                      onChange={(e) => updateItem(i, 'name', e.target.value)}
                    />
                    <Input
                      className="col-span-3 md:col-span-2"
                      type="number" min="1"
                      value={it.quantity}
                      onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 0)}
                    />
                    <Input
                      className="col-span-4 md:col-span-2"
                      type="number" step="0.01"
                      value={it.unitPrice}
                      onChange={(e) => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                    <div className="col-span-4 md:col-span-2 text-right font-medium text-sm">
                      {fmt(it.quantity * it.unitPrice)}
                    </div>
                    <Button
                      className="col-span-1"
                      size="icon" variant="ghost"
                      onClick={() => removeItem(i)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {(form.items || []).length === 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => addItem()}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Agregar artículo personalizado
                  </Button>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Términos de pago</Label>
                  <Textarea rows={3} value={form.payment_terms || ''} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Notas</Label>
                  <Textarea rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Estado</Label>
                  <Select value={form.status || 'draft'} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="sent">Enviada</SelectItem>
                      <SelectItem value="approved">Aprobada</SelectItem>
                      <SelectItem value="rejected">Rechazada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium">{fmt(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Descuento</span>
                  <Input
                    type="number" step="0.01"
                    className="w-28 h-7 text-right"
                    value={form.discount || 0}
                    onChange={(e) => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>IVA (%)</span>
                  <Input
                    type="number" step="0.01"
                    className="w-28 h-7 text-right"
                    value={Math.round((form.iva_rate || 0) * 100)}
                    onChange={(e) => setForm({ ...form, iva_rate: (parseFloat(e.target.value) || 0) / 100 })}
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Importe IVA</span>
                  <span>{fmt(totals.iva)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="gold-text">{fmt(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving} className="gold-gradient-bg text-white hover:opacity-90">
              {saving ? 'Guardando...' : editing ? 'Guardar Cambios' : 'Crear Cotización'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
