'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Save, Store } from 'lucide-react'
import { toast } from 'sonner'

export function SettingsModule() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/settings').then(r => r.json())
      setSettings(r.settings || {})
    } catch (e: any) {
      toast.error('Error al cargar configuración: ' + e.message)
    } finally {
      setLoading(false)
    }
  }
  useState(() => { load() })

  async function save() {
    setSaving(true)
    try {
      const r = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!r.ok) throw new Error('Error al guardar')
      toast.success('Configuración guardada')
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Card className="p-8 text-center text-muted-foreground">Cargando...</Card>

  return (
    <div className="space-y-4 max-w-3xl">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-serif-display text-lg">Información del Negocio</h3>
            <p className="text-xs text-muted-foreground">Estos datos aparecerán en cotizaciones y contratos PDF</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Nombre del negocio</Label>
            <Input value={settings.business_name || ''} onChange={(e) => setSettings({ ...settings, business_name: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Eslogan / Giro</Label>
            <Input value={settings.business_tagline || ''} onChange={(e) => setSettings({ ...settings, business_tagline: e.target.value })} />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input value={settings.business_phone || ''} onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={settings.business_email || ''} onChange={(e) => setSettings({ ...settings, business_email: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Dirección</Label>
            <Input value={settings.business_address || ''} onChange={(e) => setSettings({ ...settings, business_address: e.target.value })} />
          </div>
          <div>
            <Label>RFC</Label>
            <Input value={settings.business_rfc || ''} onChange={(e) => setSettings({ ...settings, business_rfc: e.target.value.toUpperCase() })} />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={save} disabled={saving} className="gold-gradient-bg text-white hover:opacity-90">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
