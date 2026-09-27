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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Pencil, Plus, Search, Trash2, Package, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  description: string | null
  category: string | null
  sku: string | null
  price: number
  cost: number
  stock: number
  image_url: string | null
  active: number
}

const CATEGORIES = ['Platos', 'Copas', 'Tazas', 'Cubiertos', 'Servicio', 'Decoración', 'Textiles', 'Accesorios', 'Otros']

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0)
}

export function ProductsModule() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<any>({})

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/products')
      const d = await r.json()
      setProducts(d.products || [])
    } catch (e: any) {
      toast.error('Error al cargar productos: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useState(() => {
    load()
  })

  const filtered = products.filter((p) => {
    if (filterCat !== 'all' && p.category !== filterCat) return false
    if (search) {
      const s = search.toLowerCase()
      return p.name.toLowerCase().includes(s) || p.sku?.toLowerCase().includes(s) || p.description?.toLowerCase().includes(s)
    }
    return true
  })

  function openNew() {
    setEditing(null)
    setForm({
      name: '', description: '', category: 'Platos', sku: '', price: 0, cost: 0, stock: 0,
    })
    setDialogOpen(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({
      id: p.id, name: p.name, description: p.description || '', category: p.category || 'Platos',
      sku: p.sku || '', price: p.price, cost: p.cost, stock: p.stock, active: p.active === 1,
    })
    setDialogOpen(true)
  }

  async function save() {
    if (!form.name) {
      toast.error('Nombre es requerido')
      return
    }
    try {
      const method = editing ? 'PUT' : 'POST'
      const r = await fetch('/api/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!r.ok) throw new Error((await r.json()).error || 'Error')
      toast.success(editing ? 'Producto actualizado' : 'Producto creado')
      setDialogOpen(false)
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      const r = await fetch(`/api/products?id=${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('Error')
      toast.success('Producto eliminado')
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
            placeholder="Buscar por nombre, SKU o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="gold-gradient-bg text-white hover:opacity-90">
          <Plus className="h-4 w-4 mr-1" /> Nuevo Producto
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto scroll-area-thin">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60">
              <tr>
                <th className="text-left p-3 font-semibold">Producto</th>
                <th className="text-left p-3 font-semibold hidden md:table-cell">Categoría</th>
                <th className="text-left p-3 font-semibold hidden lg:table-cell">SKU</th>
                <th className="text-right p-3 font-semibold">Precio</th>
                <th className="text-center p-3 font-semibold">Stock</th>
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
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  No hay productos registrados
                </td></tr>
              )}
              {!loading && filtered.map((p) => (
                <tr key={p.id} className="border-t hover:bg-secondary/30 transition-colors">
                  <td className="p-3">
                    <div className="font-medium">{p.name}</div>
                    {p.description && <div className="text-xs text-muted-foreground line-clamp-1">{p.description}</div>}
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <Badge variant="outline" className="border-primary/40 text-primary">{p.category || '—'}</Badge>
                  </td>
                  <td className="p-3 hidden lg:table-cell font-mono text-xs text-muted-foreground">{p.sku || '—'}</td>
                  <td className="p-3 text-right font-medium">{fmt(p.price)}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      p.stock <= 5 ? 'bg-red-100 text-red-700' :
                      p.stock <= 20 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {p.stock <= 5 && <AlertTriangle className="h-3 w-3" />}
                      {p.stock}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {p.active === 1 ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(p.id)} className="text-destructive hover:text-destructive">
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif-display text-xl">
              {editing ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="md:col-span-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>Categoría</Label>
              <Select value={form.category || 'Platos'} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sku">SKU / Código</Label>
              <Input id="sku" value={form.sku || ''} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="price">Precio venta (MXN)</Label>
              <Input id="price" type="number" step="0.01" value={form.price || 0} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label htmlFor="cost">Costo (MXN)</Label>
              <Input id="cost" type="number" step="0.01" value={form.cost || 0} onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label htmlFor="stock">Existencias</Label>
              <Input id="stock" type="number" value={form.stock || 0} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} />
            </div>
            {editing && (
              <div className="flex items-center gap-3">
                <Label htmlFor="active">Activo</Label>
                <Switch id="active" checked={form.active !== false} onCheckedChange={(c) => setForm({ ...form, active: c })} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="gold-gradient-bg text-white hover:opacity-90">
              {editing ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
