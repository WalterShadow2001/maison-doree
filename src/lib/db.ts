import { createClient } from '@libsql/client'

const url = process.env.DATABASE_URL || ''
const authToken = process.env.TURSO_AUTH_TOKEN || ''

if (!url) {
  throw new Error('DATABASE_URL is not set')
}

export const db = createClient({
  url,
  authToken: authToken || undefined,
})

export async function initDatabase() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      sku TEXT,
      price REAL NOT NULL DEFAULT 0,
      cost REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      image_url TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'individual',
      email TEXT,
      phone TEXT,
      address TEXT,
      rfc TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS quotations (
      id TEXT PRIMARY KEY,
      folio TEXT NOT NULL UNIQUE,
      client_id TEXT,
      client_snapshot TEXT,
      date TEXT NOT NULL,
      valid_until TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      items TEXT NOT NULL DEFAULT '[]',
      subtotal REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      iva_rate REAL NOT NULL DEFAULT 0.16,
      iva REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      notes TEXT,
      payment_terms TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      folio TEXT NOT NULL UNIQUE,
      client_id TEXT,
      client_snapshot TEXT,
      event_date TEXT NOT NULL,
      event_type TEXT,
      venue TEXT,
      start_time TEXT,
      end_time TEXT,
      guests INTEGER DEFAULT 0,
      items TEXT NOT NULL DEFAULT '[]',
      subtotal REAL NOT NULL DEFAULT 0,
      deposit REAL NOT NULL DEFAULT 0,
      balance REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      notes TEXT,
      terms TEXT,
      signed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      client_id TEXT,
      date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      type TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      venue TEXT,
      notes TEXT,
      color TEXT NOT NULL DEFAULT '#C9A961',
      contract_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `)

  // Default business settings
  await db.execute({
    sql: `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
    args: ['business_name', 'Maison Dorée']
  })
  await db.execute({
    sql: `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
    args: ['business_tagline', 'Loza y Eventos de Lujo']
  })
  await db.execute({
    sql: `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
    args: ['business_phone', '+52 555 123 4567']
  })
  await db.execute({
    sql: `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
    args: ['business_email', 'contacto@maisondoree.mx']
  })
  await db.execute({
    sql: `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
    args: ['business_address', 'Av. Reforma 1234, Ciudad de México']
  })
  await db.execute({
    sql: `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
    args: ['business_rfc', 'MDO900101AB1']
  })
}
