# Maison Dorée · Sistema de Gestión de Loza y Eventos

Sistema integral de administración para negocios de renta y venta de loza, eventos y banquetes.

## Características

- **Dashboard** con KPIs, ingresos mensuales, alertas de inventario bajo y próximos eventos
- **Inventario** completo de productos con categorías, SKU, precios, existencias y estado
- **Clientes** con soporte para personas físicas y empresas, RFC, contactos
- **Cotizaciones** con generación de PDF profesional (cálculo de IVA, descuentos, vigencia)
- **Contratos de Renta** con PDF completo (términos legales, depósito, saldos, firmas)
- **Calendario de Eventos** con vista mensual, tipos codificados por color, próximos eventos
- **Configuración** del negocio (nombre, RFC, dirección) usada en todos los PDFs

## Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Base de Datos**: Turso (libSQL) — SQLite distribuido en la nube
- **UI**: Tailwind CSS 4 + shadcn/ui + Recharts
- **PDFs**: jsPDF + jsPDF-autotable (server-side)
- **Hosting**: GitHub + Vercel

## Desarrollo Local

```bash
# 1. Instalar dependencias
bun install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Turso

# 3. Inicializar la base de datos
bun run scripts/init-db.ts

# 4. (Opcional) Cargar datos de muestra
bun run scripts/seed.ts

# 5. Iniciar servidor de desarrollo
bun run dev
```

## Variables de Entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de conexión a Turso (libsql://...) |
| `TURSO_AUTH_TOKEN` | Token de autenticación de Turso |

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/          # API routes (products, clients, quotations, contracts, events, settings, dashboard, pdf)
│   ├── layout.tsx    # Layout raíz con tema Maison Dorée
│   └── page.tsx      # SPA con sidebar y tabs
├── components/
│   ├── ui/           # Componentes shadcn/ui base
│   └── maison/       # Módulos de negocio
├── lib/
│   ├── db.ts         # Cliente Turso + esquema SQL
│   └── pdf.ts        # Generadores de PDF (cotización, contrato)
└── public/
    ├── logo.svg      # Logo Maison Dorée
    └── favicon.svg
```

## Funcionalidades de Administración

### Cotizaciones
- Crear cotizaciones con múltiples artículos (seleccionables del inventario o personalizados)
- Cálculo automático de subtotal, descuento, IVA y total
- Vigencia configurable
- Generación de PDF profesional con marca Maison Dorée
- Estados: Borrador, Enviada, Aprobada, Rechazada, Cancelada

### Contratos de Renta
- Crear contratos asociados a un evento específico
- Datos completos del evento (tipo, fecha, lugar, horario, invitados)
- Cálculo automático de depósito (50%) y saldo pendiente
- Términos y condiciones estándar de Maison Dorée incluidos
- Espacios para firma de ambas partes
- Estados: Borrador, Activo, Completado, Cancelado

### Calendario de Eventos
- Vista mensual con colores por tipo de evento
- Sidebar con próximos eventos
- Click para ver/editar evento
- Doble-click en día para crear nuevo evento
- Estados: Programado, Confirmado, Completado, Cancelado

## Licencia

Propietaria · Maison Dorée © 2026
