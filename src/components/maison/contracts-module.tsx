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
import { ScrollText, Plus, Search, Trash2, Pencil, Download, X, PlusCircle, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0)
}
function fmtDate(d: string) {
  if (!d) return '—'
  try { return new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return d }
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-secondary text-secondary-foreground',
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}
const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador', active: 'Activo', completed: 'Completado', cancelled: 'Cancelado',
}

const EVENT_TYPES = ['Boda', 'XV Años', 'Bautizo', 'Corporativo', 'Aniversario', 'Cumpleaños', 'Otro']

export function ContractsModule() {
  const [contracts, setContracts] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [newClientDialog, setNewClientDialog] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [creatingClient, setCreatingClient] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [c, p, cl] = await Promise.all([
        fetch('/api/contracts').then(r => r.json()),
        fetch('/api/products').then(r => r.json()),
        fetch('/api/clients').then(r => r.json()),
      ])
      setContracts(c.contracts || [])
      setProducts(p.products || [])
      setClients(cl.clients || [])
    } catch (e: any) {
      toast.error('Error al cargar: ' + e.message)
    } finally {
      setLoading(false)
    }
  }
  useState(() => { load() })

  const filtered = contracts.filter((c) => {
    if (!search) return true
    const s = search.toLowerCase()
    return c.folio?.toLowerCase().includes(s) || c.client_name?.toLowerCase().includes(s)
  })

  function openNew() {
    const today = new Date().toISOString().slice(0, 10)
    const eventDate = new Date(); eventDate.setDate(eventDate.getDate() + 30)
    setForm({
      event_date: eventDate.toISOString().slice(0, 10),
      date: today,
      client_id: '',
      event_type: 'Boda',
      venue: '',
      start_time: '13:00',
      end_time: '20:00',
      guests: 100,
      items: [] as any[],
      status: 'draft',
      notes: '',
      terms: '',
    })
    setDialogOpen(true)
  }

  function openEdit(c: any) {
    setEditing(c)
    setForm({
      id: c.id,
      folio: c.folio,
      event_date: c.event_date,
      date: c.date || (c.created_at || '').slice(0, 10),
      client_id: c.client_id || '',
      event_type: c.event_type || 'Boda',
      venue: c.venue || '',
      start_time: c.start_time || '13:00',
      end_time: c.end_time || '20:00',
      guests: c.guests || 0,
      items: c.items || [],
      status: c.status || 'draft',
      notes: c.notes || '',
      terms: c.terms || '',
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
    const subtotal = (form.items || []).reduce((s: number, it: any) => s + (it.quantity * it.unitPrice), 0)
    const deposit = subtotal * 0.5
    const balance = subtotal - deposit
    const total = subtotal
    return { subtotal, deposit, balance, total }
  }

  async function save() {
    setSaving(true)
    try {
      const { subtotal, deposit, balance, total } = calc()
      const payload = { ...form, subtotal, deposit, balance, total }
      const method = editing ? 'PUT' : 'POST'
      const r = await fetch('/api/contracts', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      if (!r.ok) throw new Error((await r.json()).error || 'Error')
      toast.success(editing ? 'Contrato actualizado' : 'Contrato creado')
      setDialogOpen(false)
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este contrato?')) return
    try {
      const r = await fetch(`/api/contracts?id=${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('Error')
      toast.success('Contrato eliminado')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  function downloadPDF(id: string) {
    window.open(`/api/contracts/pdf?id=${id}`, '_blank')
  }

  async function createQuickClient() {
    if (!newClientName.trim()) {
      toast.error('Ingresa un nombre para el cliente')
      return
    }
    setCreatingClient(true)
    try {
      const r = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClientName.trim(), type: 'individual' }),
      })
      if (!r.ok) throw new Error((await r.json()).error || 'Error')
      const data = await r.json()
      const newClient = data.client
      await load()
      setForm({ ...form, client_id: newClient.id })
      toast.success(`Cliente "${newClient.name}" creado y seleccionado`)
      setNewClientName('')
      setNewClientDialog(false)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setCreatingClient(false)
    }
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
          <Plus className="h-4 w-4 mr-1" /> Nuevo Contrato
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto scroll-area-thin">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60">
              <tr>
                <th className="text-left p-3 font-semibold">Folio</th>
                <th className="text-left p-3 font-semibold">Cliente</th>
                <th className="text-left p-3 font-semibold hidden md:table-cell">Evento</th>
                <th className="text-left p-3 font-semibold hidden lg:table-cell">Fecha Evento</th>
                <th className="text-right p-3 font-semibold">Total</th>
                <th className="text-center p-3 font-semibold">Estado</th>
                <th className="text-right p-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Cargando...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">
                  <ScrollText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  No hay contratos registrados
                </td></tr>
              )}
              {!loading && filtered.map((c) => (
                <tr key={c.id} className="border-t hover:bg-secondary/30">
                  <td className="p-3 font-mono text-xs font-medium">{c.folio}</td>
                  <td className="p-3">{c.client_name || '—'}</td>
                  <td className="p-3 hidden md:table-cell">
                    <Badge variant="outline" className="border-primary/40 text-primary">{c.event_type || '—'}</Badge>
                  </td>
                  <td className="p-3 hidden lg:table-cell text-muted-foreground">{fmtDate(c.event_date)}</td>
                  <td className="p-3 text-right font-medium">{fmt(c.total)}</td>
                  <td className="p-3 text-center">
                    <Badge className={STATUS_STYLES[c.status] || STATUS_STYLES.draft}>
                      {STATUS_LABEL[c.status] || c.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => downloadPDF(c.id)} title="Descargar PDF">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(c.id)} className="text-destructive">
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
              {editing ? `Editar Contrato ${editing.folio || ''}` : 'Nuevo Contrato de Renta'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Event info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Fecha Evento</Label>
                <Input type="date" value={form.event_date || ''} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Tipo Evento</Label>
                <Select value={form.event_type || 'Boda'} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Inicio</Label>
                <Input type="time" value={form.start_time || ''} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Fin</Label>
                <Input type="time" value={form.end_time || ''} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Cliente</Label>
                <div className="flex gap-2">
                  <Select value={form.client_id || ''} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setNewClientDialog(true)}
                    title="Agregar cliente nuevo (solo nombre)"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs">Lugar / Salón</Label>
                <Input value={form.venue || ''} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">No. Invitados</Label>
                <Input type="number" min="0" value={form.guests || 0} onChange={(e) => setForm({ ...form, guests: parseInt(e.target.value) || 0 })} />
              </div>
            </div>

            {/* Items */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-secondary/60 px-3 py-2 flex items-center justify-between">
                <span className="font-semibold text-sm">Mercancía en Renta</span>
                <Select onValueChange={(v) => {
                  const p = products.find(x => x.id === v)
                  if (p) addItem(p)
                }}>
                  <SelectTrigger className="h-7 w-auto text-xs gap-1">
                    <PlusCircle className="h-3 w-3" />
                    <SelectValue placeholder="Agregar producto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} · stock {p.stock}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="max-h-72 overflow-y-auto scroll-area-thin">
                {(form.items || []).length === 0 && (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    Sin mercancía. Use el botón "Agregar producto" para añadir piezas a la renta.
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
                    <Button className="col-span-1" size="icon" variant="ghost" onClick={() => removeItem(i)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {(form.items || []).length === 0 && (
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => addItem()}>
                    <Plus className="h-3 w-3 mr-1" /> Agregar artículo personalizado
                  </Button>
                )}
              </div>
            </div>

            {/* Totals + extras */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Términos adicionales (opcional - si vacío usa términos estándar)</Label>
                  <Textarea
                    rows={4}
                    placeholder="Condiciones especiales del contrato..."
                    value={form.terms || ''}
                    onChange={(e) => setForm({ ...form, terms: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Notas internas</Label>
                  <Textarea rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Estado</Label>
                  <Select value={form.status || 'draft'} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium">{fmt(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Depósito (50%)</span>
                  <span>{fmt(totals.deposit)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Saldo pendiente</span>
                  <span>{fmt(totals.balance)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-semibold">
                  <span>Total Contrato</span>
                  <span className="gold-text">{fmt(totals.total)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-3 pt-2 border-t">
                  El contrato generado en PDF incluirá los términos y condiciones estándar de Maison Dorée,
                  así como las firmas de ambas partes.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving} className="gold-gradient-bg text-white hover:opacity-90">
              {saving ? 'Guardando...' : editing ? 'Guardar Cambios' : 'Crear Contrato'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick client creation dialog (name only) */}
      <Dialog open={newClientDialog} onOpenChange={setNewClientDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif-display text-xl flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Nuevo Cliente Rápido
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="quick-client-name">Nombre del cliente *</Label>
              <Input
                id="quick-client-name"
                autoFocus
                placeholder="Ej. María Fernández, Banquetes del Sur, etc."
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !creatingClient) {
                    e.preventDefault()
                    createQuickClient()
                  }
                }}
              />
            </div>
            <div className="bg-secondary/40 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">💡 Solo necesitas el nombre</p>
              <p>
                Los demás datos (RFC, teléfono, email, dirección) los podrás
                completar después en la sección <strong>Clientes</strong> del menú.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewClientDialog(false)}>Cancelar</Button>
            <Button
              onClick={createQuickClient}
              disabled={creatingClient || !newClientName.trim()}
              className="gold-gradient-bg text-white hover:opacity-90"
            >
              {creatingClient ? 'Creando...' : 'Crear y Seleccionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
