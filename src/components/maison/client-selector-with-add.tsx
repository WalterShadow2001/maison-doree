'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'

export interface ClientOption {
  id: string
  name: string
  email?: string | null
  phone?: string | null
}

interface ClientSelectorWithAddProps {
  /** Currently selected client id */
  value: string
  /** Called when user picks an existing client or a newly created one */
  onChange: (clientId: string) => void
  /** List of existing clients */
  clients: ClientOption[]
  /** Placeholder text for the select */
  placeholder?: string
  /** Optional label above the selector */
  label?: string
  /** Whether to span two columns in a grid (used in events dialog) */
  fullSpan?: boolean
  /** Called after a new client is created, so the parent can refresh its client list */
  onClientCreated?: (newClient: ClientOption) => void
}

/**
 * Reusable client selector with an "Add new client (name only)" button.
 * Used in: quotations, contracts, events modules.
 */
export function ClientSelectorWithAdd({
  value,
  onChange,
  clients,
  placeholder = 'Seleccionar cliente...',
  label,
  fullSpan = false,
  onClientCreated,
}: ClientSelectorWithAddProps) {
  const [newClientDialog, setNewClientDialog] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [creatingClient, setCreatingClient] = useState(false)

  const handleCreate = useCallback(async () => {
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
      const newClient = data.client as ClientOption
      // Auto-select the new client
      onChange(newClient.id)
      // Notify parent so it can refresh the list
      onClientCreated?.(newClient)
      toast.success(`Cliente "${newClient.name}" creado y seleccionado`)
      setNewClientName('')
      setNewClientDialog(false)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setCreatingClient(false)
    }
  }, [newClientName, onChange, onClientCreated])

  const selectedClient = clients.find((c) => c.id === value)

  return (
    <div className={fullSpan ? 'md:col-span-2' : ''}>
      {label && <Label className="text-xs">{label}</Label>}
      <div className="flex gap-2">
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger className="flex-1"><SelectValue placeholder={placeholder} /></SelectTrigger>
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
          aria-label="Agregar cliente nuevo"
        >
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>
      {value && selectedClient && (
        <p className="text-[10px] text-muted-foreground mt-1">
          {selectedClient.email ||
            selectedClient.phone ||
            'Puedes completar los datos del cliente después en la sección Clientes'}
        </p>
      )}

      {/* Quick client creation dialog */}
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
                    handleCreate()
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
              onClick={handleCreate}
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
