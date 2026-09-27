'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Pencil, Plus, Search, Trash2, Users, Building2, User } from 'lucide-react'
import { toast } from 'sonner'

interface Client {
  id: string
  name: string
  type: string
  email: string | null
  phone: string | null
  address: string | null
  rfc: string | null
  notes: string | null
}

export function ClientsModule() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState<any>({})

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/clients')
      const d = await r.json()
      setClients(d.clients || [])
    } catch (e: any) {
      toast.error('Error al cargar clientes: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useState(() => { load() })

  const filtered = clients.filter((c) => {
    if (!search) return true
    const s = search.toLowerCase()
    return c.name.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s) ||
      c.phone?.toLowerCase().includes(s) || c.rfc?.toLowerCase().includes(s)
  })

  function openNew() {
    setEditing(null)
    setForm({ name: '', type: 'individual', email: '', phone: '', address: '', rfc: '', notes: '' })
    setDialogOpen(true)
  }

  function openEdit(c: Client) {
    setEditing(c)
    setForm({
      id: c.id, name: c.name, type: c.type, email: c.email || '', phone: c.phone || '',
      address: c.address || '', rfc: c.rfc || '', notes: c.notes || '',
    })
    setDialogOpen(true)
  }

  async function save() {
    if (!form.name) { toast.error('Nombre es requerido'); return }
    try {
      const method = editing ? 'PUT' : 'POST'
      const r = await fetch('/api/clients', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (!r.ok) throw new Error((await r.json()).error || 'Error')
      toast.success(editing ? 'Cliente actualizado' : 'Cliente creado')
      setDialogOpen(false)
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este cliente?')) return
    try {
      const r = await fetch(`/api/clients?id=${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('Error')
      toast.success('Cliente eliminado')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente por nombre, email, teléfono o RFC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openNew} className="gold-gradient-bg text-white hover:opacity-90">
          <Plus className="h-4 w-4 mr-1" /> Nuevo Cliente
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {loading && (
          <Card className="p-8 col-span-full text-center text-muted-foreground">Cargando...</Card>
        )}
        {!loading && filtered.length === 0 && (
          <Card className="p-8 col-span-full text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
            No hay clientes registrados
          </Card>
        )}
        {!loading && filtered.map((c) => (
          <Card key={c.id} className="p-4 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  c.type === 'business' ? 'bg-primary/15 text-primary' : 'bg-secondary text-foreground'
                }`}>
                  {c.type === 'business' ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.email || '—'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.phone || '—'}
                  </div>
                  {c.rfc && (
                    <Badge variant="outline" className="mt-2 text-xs">RFC: {c.rfc}</Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(c.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif-display text-xl">
              {editing ? 'Editar Cliente' : 'Nuevo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="md:col-span-2">
              <Label>Nombre / Razón Social *</Label>
              <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Tipo de cliente</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  size="sm"
                  variant={form.type === 'individual' ? 'default' : 'outline'}
                  onClick={() => setForm({ ...form, type: 'individual' })}
                  className={form.type === 'individual' ? 'gold-gradient-bg text-white' : ''}
                >
                  <User className="h-4 w-4 mr-1" /> Persona Física
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={form.type === 'business' ? 'default' : 'outline'}
                  onClick={() => setForm({ ...form, type: 'business' })}
                  className={form.type === 'business' ? 'gold-gradient-bg text-white' : ''}
                >
                  <Building2 className="h-4 w-4 mr-1" /> Empresa
                </Button>
              </div>
            </div>
            <div>
              <Label>RFC</Label>
              <Input value={form.rfc || ''} onChange={(e) => setForm({ ...form, rfc: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Dirección</Label>
              <Textarea rows={2} value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Notas</Label>
              <Textarea rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="gold-gradient-bg text-white hover:opacity-90">
              {editing ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
