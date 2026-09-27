import { NextRequest, NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'
import { generateQuotationPDF, getBusinessInfo } from '@/lib/pdf'

export const runtime = 'nodejs'

async function nextFolio(prefix: string): Promise<string> {
  const result = await db.execute(
    `SELECT folio FROM quotations WHERE folio LIKE ? ORDER BY id DESC LIMIT 1`
  )
  const rows = result.rows as any[]
  let next = 1
  if (rows.length > 0) {
    const m = rows[0].folio.match(/\d+$/)
    if (m) next = parseInt(m[0], 10) + 1
  }
  return `${prefix}-${String(next).padStart(5, '0')}`
}

export async function GET(req: NextRequest) {
  try {
    await initDatabase()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (id) {
      const r = await db.execute({ sql: 'SELECT * FROM quotations WHERE id = ?', args: [id] })
      if (r.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const q = r.rows[0] as any
      const clientR = q.client_id
        ? await db.execute({ sql: 'SELECT * FROM clients WHERE id = ?', args: [q.client_id] })
        : { rows: [] }
      return NextResponse.json({
        quotation: { ...q, items: JSON.parse(q.items || '[]'), client: clientR.rows[0] || null },
      })
    }

    const result = await db.execute(`
      SELECT q.*, c.name as client_name
      FROM quotations q
      LEFT JOIN clients c ON q.client_id = c.id
      ORDER BY q.created_at DESC
    `)
    const rows = (result.rows as any[]).map((r) => ({
      ...r,
      items: JSON.parse(r.items || '[]'),
    }))
    return NextResponse.json({ quotations: rows })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await initDatabase()
    const body = await req.json()
    const id = body.id || crypto.randomUUID()
    const folio = body.folio || await nextFolio('COT')

    const clientSnapshot = body.client ? JSON.stringify(body.client) : null

    await db.execute({
      sql: `INSERT INTO quotations
        (id, folio, client_id, client_snapshot, date, valid_until, status, items, subtotal, discount, iva_rate, iva, total, notes, payment_terms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        folio,
        body.client_id || null,
        clientSnapshot,
        body.date || new Date().toISOString().slice(0, 10),
        body.valid_until || null,
        body.status || 'draft',
        JSON.stringify(body.items || []),
        body.subtotal || 0,
        body.discount || 0,
        body.iva_rate ?? 0.16,
        body.iva || 0,
        body.total || 0,
        body.notes || null,
        body.payment_terms || null,
      ],
    })

    const r = await db.execute({ sql: 'SELECT * FROM quotations WHERE id = ?', args: [id] })
    const q = r.rows[0] as any
    return NextResponse.json({
      quotation: { ...q, items: JSON.parse(q.items || '[]') },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await initDatabase()
    const body = await req.json()
    const clientSnapshot = body.client ? JSON.stringify(body.client) : null

    await db.execute({
      sql: `UPDATE quotations SET
        client_id = ?, client_snapshot = ?, date = ?, valid_until = ?, status = ?,
        items = ?, subtotal = ?, discount = ?, iva_rate = ?, iva = ?, total = ?,
        notes = ?, payment_terms = ?, updated_at = datetime('now')
        WHERE id = ?`,
      args: [
        body.client_id || null,
        clientSnapshot,
        body.date,
        body.valid_until || null,
        body.status || 'draft',
        JSON.stringify(body.items || []),
        body.subtotal || 0,
        body.discount || 0,
        body.iva_rate ?? 0.16,
        body.iva || 0,
        body.total || 0,
        body.notes || null,
        body.payment_terms || null,
        body.id,
      ],
    })

    const r = await db.execute({ sql: 'SELECT * FROM quotations WHERE id = ?', args: [body.id] })
    const q = r.rows[0] as any
    return NextResponse.json({
      quotation: { ...q, items: JSON.parse(q.items || '[]') },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await initDatabase()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await db.execute({ sql: 'DELETE FROM quotations WHERE id = ?', args: [id] })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
