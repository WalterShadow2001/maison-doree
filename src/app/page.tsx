'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  LayoutDashboard, Package, Users, FileText, ScrollText, Calendar,
  Settings, Menu,
} from 'lucide-react'
import { DashboardModule } from '@/components/maison/dashboard-module'
import { ProductsModule } from '@/components/maison/products-module'
import { ClientsModule } from '@/components/maison/clients-module'
import { QuotationsModule } from '@/components/maison/quotations-module'
import { ContractsModule } from '@/components/maison/contracts-module'
import { EventsModule } from '@/components/maison/events-module'
import { SettingsModule } from '@/components/maison/settings-module'

type Tab = 'dashboard' | 'products' | 'clients' | 'quotations' | 'contracts' | 'events' | 'settings'

const NAV: { id: Tab; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Inventario', icon: Package },
  { id: 'clients', label: 'Clientes', icon: Users },
  { id: 'quotations', label: 'Cotizaciones', icon: FileText },
  { id: 'contracts', label: 'Contratos de Renta', icon: ScrollText },
  { id: 'events', label: 'Calendario', icon: Calendar },
  { id: 'settings', label: 'Configuración', icon: Settings },
]

const TITLES: Record<Tab, { title: string; sub: string }> = {
  dashboard: { title: 'Dashboard', sub: 'Resumen general del negocio' },
  products: { title: 'Inventario', sub: 'Gestión de loza y artículos rentables' },
  clients: { title: 'Clientes', sub: 'Directorio de clientes y empresas' },
  quotations: { title: 'Cotizaciones', sub: 'Cotizaciones con generación de PDF' },
  contracts: { title: 'Contratos de Renta', sub: 'Contratos de renta con generación de PDF' },
  events: { title: 'Calendario de Eventos', sub: 'Agenda de eventos y reservaciones' },
  settings: { title: 'Configuración', sub: 'Datos del negocio para documentos PDF' },
}

interface NavItemProps {
  item: typeof NAV[0]
  active: boolean
  onClick: () => void
}

function NavItem({ item, active, onClick }: NavItemProps) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'gold-gradient-bg text-white shadow-sm'
          : 'text-sidebar-foreground hover:bg-sidebar-accent'
      }`}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="truncate">{item.label}</span>
    </button>
  )
}

interface SidebarContentProps {
  activeTab: Tab
  onSelectTab: (t: Tab) => void
}

function SidebarContent({ activeTab, onSelectTab }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-full gold-gradient-bg flex items-center justify-center shadow-sm">
            <span className="font-serif-display text-white font-bold text-lg">MD</span>
            <div className="absolute inset-0 rounded-full border-2 border-white/30" />
          </div>
          <div>
            <div className="font-serif-display text-lg font-bold leading-tight">
              Maison <span className="gold-text">Dorée</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Loza &amp; Eventos
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scroll-area-thin">
        {NAV.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            active={activeTab === item.id}
            onClick={() => onSelectTab(item.id)}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>v1.0 · 2026</span>
          <span className="gold-text font-medium">Maison Dorée</span>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)

  const currentTitle = TITLES[activeTab]

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border sticky top-0 h-screen">
        <SidebarContent activeTab={activeTab} onSelectTab={setActiveTab} />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent
            activeTab={activeTab}
            onSelectTab={(t) => { setActiveTab(t); setMobileOpen(false) }}
          />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center gap-3 px-4 md:px-6 py-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="font-serif-display text-xl md:text-2xl font-bold truncate">
                {currentTitle.title}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground truncate">{currentTitle.sub}</p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          {activeTab === 'dashboard' && <DashboardModule />}
          {activeTab === 'products' && <ProductsModule />}
          {activeTab === 'clients' && <ClientsModule />}
          {activeTab === 'quotations' && <QuotationsModule />}
          {activeTab === 'contracts' && <ContractsModule />}
          {activeTab === 'events' && <EventsModule />}
          {activeTab === 'settings' && <SettingsModule />}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t py-3 px-6 text-center text-xs text-muted-foreground">
          Maison Dorée · Sistema de Gestión de Loza y Eventos · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  )
}
