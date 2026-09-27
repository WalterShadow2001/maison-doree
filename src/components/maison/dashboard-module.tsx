'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, Users, FileText, ScrollText, Calendar, TrendingUp, AlertTriangle, Clock } from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n || 0)
}
function fmtDate(d: string) {
  if (!d) return '—'
  try { return new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return d }
}

interface DashboardData {
  stats: {
    products: number
    totalStock: number
    clients: number
    quotations: number
    quotationsTotal: number
    contracts: number
    contractsTotal: number
    upcomingEvents: number
  }
  recentQuotations: any[]
  upcomingEvents: any[]
  revenueByMonth: any[]
  lowStock: any[]
}

export function DashboardModule() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useState(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => {
      setData(d)
      setLoading(false)
    }).catch(e => {
      console.error(e)
      setLoading(false)
    })
  })

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-6 h-32 animate-pulse bg-secondary/30" />
        ))}
      </div>
    )
  }

  if (!data) return null

  const statCards = [
    { label: 'Productos', value: String(data.stats.products), sub: `${data.stats.totalStock} piezas en stock`, icon: Package, color: 'text-primary' },
    { label: 'Clientes', value: String(data.stats.clients), sub: 'Registrados', icon: Users, color: 'text-blue-600' },
    { label: 'Cotizaciones', value: String(data.stats.quotations), sub: fmt(data.stats.quotationsTotal), icon: FileText, color: 'text-emerald-600' },
    { label: 'Contratos', value: String(data.stats.contracts), sub: fmt(data.stats.contractsTotal), icon: ScrollText, color: 'text-amber-700' },
  ]

  const chartData = (data.revenueByMonth || []).map((r: any) => {
    const [y, m] = r.month.split('-')
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    return { name: monthNames[parseInt(m) - 1] || m, total: Number(r.total) }
  })

  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="p-4 relative overflow-hidden group">
              <div className="absolute -right-3 -top-3 w-20 h-20 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors" />
              <div className="relative">
                <Icon className={`h-5 w-5 ${s.color} mb-2`} />
                <div className="text-2xl font-bold font-serif-display">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                <div className="text-xs text-muted-foreground/80 mt-1">{s.sub}</div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Upcoming events banner */}
      <Card className="p-5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-serif-display text-xl">{data.stats.upcomingEvents} eventos próximos</div>
              <div className="text-sm text-muted-foreground">Calendario de eventos agendados</div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif-display text-lg flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Ingresos por cotizaciones
              </h3>
              <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
            </div>
          </div>
          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              Sin datos suficientes para mostrar el gráfico
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.015 75)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="oklch(0.50 0.02 60)" />
                <YAxis tick={{ fontSize: 12 }} stroke="oklch(0.50 0.02 60)" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: number) => fmt(v)}
                  contentStyle={{ borderRadius: 8, border: '1px solid oklch(0.90 0.015 75)' }}
                />
                <Bar dataKey="total" fill="#C9A961" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Low stock */}
        <Card className="p-5">
          <h3 className="font-serif-display text-lg flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Inventario bajo
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto scroll-area-thin">
            {(data.lowStock || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin alertas de inventario</p>
            ) : (
              (data.lowStock || []).map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded border">
                  <span className="text-sm truncate">{p.name}</span>
                  <Badge variant={p.stock <= 0 ? 'destructive' : 'secondary'}>
                    {p.stock} pzs
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Recent quotations & upcoming events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-serif-display text-lg mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Cotizaciones recientes
          </h3>
          <div className="space-y-2">
            {(data.recentQuotations || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin cotizaciones</p>
            ) : (
              (data.recentQuotations || []).map((q: any) => (
                <div key={q.id} className="flex items-center justify-between p-2 rounded hover:bg-secondary/40">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{q.client_name || 'Cliente'}</div>
                    <div className="text-xs text-muted-foreground font-mono">{q.folio} · {fmtDate(q.date)}</div>
                  </div>
                  <div className="text-sm font-medium">{fmt(q.total)}</div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-serif-display text-lg mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Próximos eventos
          </h3>
          <div className="space-y-2">
            {(data.upcomingEvents || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin eventos próximos</p>
            ) : (
              (data.upcomingEvents || []).map((e: any) => (
                <div key={e.id} className="flex items-center justify-between p-2 rounded hover:bg-secondary/40">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{e.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {fmtDate(e.date)} {e.start_time && `· ${e.start_time}`}
                      {e.venue && ` · ${e.venue}`}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">{e.type || 'Otro'}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
