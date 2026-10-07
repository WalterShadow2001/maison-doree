'use client'

import { useState, useMemo } from 'react'
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
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, MapPin, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { ClientSelectorWithAdd } from './client-selector-with-add'

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]
const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const EVENT_TYPES = ['Boda', 'XV Años', 'Bautizo', 'Corporativo', 'Aniversario', 'Cumpleaños', 'Cita', 'Otro']
const TYPE_COLORS: Record<string, string> = {
  'Boda': '#C9A961',
  'XV Años': '#E8C97C',
  'Bautizo': '#9FB7D4',
  'Corporativo': '#7B8B6F',
  'Aniversario': '#D49FB0',
  'Cumpleaños': '#E2A47B',
  'Cita': '#9C7B3F',
  'Otro': '#8C8C8C',
}
const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-zinc-200 text-zinc-700',
  cancelled: 'bg-red-100 text-red-700',
}
const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Programado', confirmed: 'Confirmado', completed: 'Completado', cancelled: 'Cancelado',
}

interface Evt {
  id: string
  title: string
  date: string
  start_time: string | null
  end_time: string | null
  type: string | null
  status: string
  venue: string | null
  notes: string | null
  color: string
  client_name?: string
}

export function EventsModule() {
  const [events, setEvents] = useState<Evt[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Evt | null>(null)
  const [form, setForm] = useState<any>({})

  async function load() {
    setLoading(true)
    try {
      const [e, c] = await Promise.all([
        fetch('/api/events').then(r => r.json()),
        fetch('/api/clients').then(r => r.json()),
      ])
      setEvents(e.events || [])
      setClients(c.clients || [])
    } catch (err: any) {
      toast.error('Error al cargar eventos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }
  useState(() => { load() })

  const monthDays = useMemo(() => {
    const firstDay = new Date(currentMonth.year, currentMonth.month, 1)
    const lastDay = new Date(currentMonth.year, currentMonth.month + 1, 0)
    const startWeekday = firstDay.getDay()
    const totalDays = lastDay.getDate()
    const cells: ({ day: number; date: string } | null)[] = []
    for (let i = 0; i < startWeekday; i++) cells.push(null)
    for (let d = 1; d <= totalDays; d++) {
      const date = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({ day: d, date })
    }
    // Fill to complete weeks
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [currentMonth])

  const eventsByDate = useMemo(() => {
    const map: Record<string, Evt[]> = {}
    for (const e of events) {
      const d = (e.date || '').slice(0, 10)
      if (!map[d]) map[d] = []
      map[d].push(e)
    }
    return map
  }, [events])

  function prevMonth() {
    setCurrentMonth((c) => {
      const m = c.month - 1
      if (m < 0) return { year: c.year - 1, month: 11 }
      return { ...c, month: m }
    })
  }
  function nextMonth() {
    setCurrentMonth((c) => {
      const m = c.month + 1
      if (m > 11) return { year: c.year + 1, month: 0 }
      return { ...c, month: m }
    })
  }
  function goToday() {
    const d = new Date()
    setCurrentMonth({ year: d.getFullYear(), month: d.getMonth() })
  }

  function openNew(date?: string) {
    setEditing(null)
    const today = new Date().toISOString().slice(0, 10)
    setForm({
      title: '',
      date: date || today,
      start_time: '13:00',
      end_time: '20:00',
      type: 'Boda',
      status: 'scheduled',
      venue: '',
      notes: '',
      client_id: '',
      color: TYPE_COLORS['Boda'],
    })
    setDialogOpen(true)
  }

  function openEdit(e: Evt) {
    setEditing(e)
    setForm({
      id: e.id,
      title: e.title,
      date: e.date,
      start_time: e.start_time || '13:00',
      end_time: e.end_time || '20:00',
      type: e.type || 'Boda',
      status: e.status,
      venue: e.venue || '',
      notes: e.notes || '',
      client_id: '',
      color: e.color || TYPE_COLORS[e.type || 'Boda'],
    })
    setDialogOpen(true)
  }

  async function save() {
    if (!form.title) { toast.error('Título requerido'); return }
    try {
      const method = editing ? 'PUT' : 'POST'
      const r = await fetch('/api/events', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (!r.ok) throw new Error((await r.json()).error || 'Error')
      toast.success(editing ? 'Evento actualizado' : 'Evento creado')
      setDialogOpen(false)
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este evento?')) return
    try {
      const r = await fetch(`/api/events?id=${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('Error')
      toast.success('Evento eliminado')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : []
  const today = new Date().toISOString().slice(0, 10)
  const upcomingEvents = events
    .filter(e => (e.date || '') >= today)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .slice(0, 5)

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Calendar */}
        <Card className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <h3 className="font-serif-display text-xl min-w-[200px] text-center">
                {MONTHS_ES[currentMonth.month]} {currentMonth.year}
              </h3>
              <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={goToday}>Hoy</Button>
              <Button size="sm" className="gold-gradient-bg text-white" onClick={() => openNew()}>
                <Plus className="h-4 w-4 mr-1" /> Evento
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS_ES.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((c, i) => {
              if (!c) return <div key={i} className="aspect-square" />
              const dayEvents = eventsByDate[c.date] || []
              const isToday = c.date === today
              const isSelected = c.date === selectedDate
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(c.date)}
                  onDoubleClick={() => openNew(c.date)}
                  className={`aspect-square rounded-lg p-1 flex flex-col items-stretch text-left transition-all hover:bg-secondary/60 border ${
                    isSelected ? 'border-primary bg-primary/5' :
                    isToday ? 'border-primary/60 bg-primary/5' : 'border-transparent'
                  }`}
                >
                  <div className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-foreground'}`}>
                    {c.day}
                  </div>
                  <div className="flex-1 mt-0.5 flex flex-col gap-0.5 overflow-hidden">
                    {dayEvents.slice(0, 2).map((e) => (
                      <div
                        key={e.id}
                        className="text-[10px] leading-tight px-1 py-0.5 rounded truncate text-white"
                        style={{ backgroundColor: e.color || TYPE_COLORS[e.type || 'Otro'] }}
                        title={`${e.title}${e.start_time ? ' · ' + e.start_time : ''}`}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-muted-foreground text-center">+{dayEvents.length - 2} más</div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Side panel */}
        <div className="lg:w-80 space-y-4">
          <Card className="p-4">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              {selectedDate ? (
                <>Eventos del {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}</>
              ) : (
                <>Próximos eventos</>
              )}
            </h4>
            <div className="space-y-2 max-h-96 overflow-y-auto scroll-area-thin">
              {(selectedDate ? selectedEvents : upcomingEvents).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Sin eventos {selectedDate ? 'para esta fecha' : 'próximos'}
                </p>
              )}
              {(selectedDate ? selectedEvents : upcomingEvents).map((e) => (
                <div
                  key={e.id}
                  className="border rounded-lg p-2 hover:shadow-sm transition group cursor-pointer"
                  onClick={() => openEdit(e)}
                >
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: e.color || TYPE_COLORS[e.type || 'Otro'] }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{e.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Badge variant="outline" className="text-[10px] py-0 h-4">{e.type || 'Otro'}</Badge>
                        <Badge variant="secondary" className="text-[10px] py-0 h-4">{STATUS_LABEL[e.status]}</Badge>
                      </div>
                      {(e.start_time || e.venue) && (
                        <div className="text-xs text-muted-foreground mt-1 flex flex-col gap-0.5">
                          {e.start_time && (
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{e.start_time}{e.end_time ? ` - ${e.end_time}` : ''}</span>
                          )}
                          {e.venue && (
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.venue}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(ev) => { ev.stopPropagation(); remove(e.id) }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Legend */}
          <Card className="p-4">
            <h4 className="font-semibold text-sm mb-2">Tipos de evento</h4>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(TYPE_COLORS).map(([t, c]) => (
                <div key={t} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: c }} />
                  {t}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif-display text-xl">
              {editing ? 'Editar Evento' : 'Nuevo Evento'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="md:col-span-2">
              <Label>Título *</Label>
              <Input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej. Boda de los Sres. Cortés" />
            </div>
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={form.date || ''} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type || 'Boda'} onValueChange={(v) => setForm({ ...form, type: v, color: TYPE_COLORS[v] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Hora inicio</Label>
              <Input type="time" value={form.start_time || ''} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div>
              <Label>Hora fin</Label>
              <Input type="time" value={form.end_time || ''} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Lugar / Salón</Label>
              <Input value={form.venue || ''} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Dirección del evento" />
            </div>
            <div>
              <ClientSelectorWithAdd
                label="Cliente (opcional)"
                value={form.client_id || ''}
                onChange={(v) => setForm({ ...form, client_id: v })}
                clients={clients}
                placeholder="Sin cliente asignado"
                onClientCreated={(c) => setClients((prev) => [...prev, c])}
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={form.status || 'scheduled'} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Programado</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Notas</Label>
              <Textarea rows={3} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="gold-gradient-bg text-white hover:opacity-90">
              {editing ? 'Guardar' : 'Crear Evento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
