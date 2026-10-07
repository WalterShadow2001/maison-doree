import { NextRequest, NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'

export const runtime = 'nodejs'

async function nextFolio(prefix: string): Promise<string> {
  // Get ALL folios for this prefix, find the max sequence number
  const result = await db.execute({
    sql: `SELECT folio FROM contracts WHERE folio LIKE ?`,
    args: [`${prefix}-%`],
  })
  const rows = result.rows as any[]
  let maxNum = 0
  for (const r of rows) {
    const m = (r.folio || '').match(/(\d+)$/)
    if (m) {
      const n = parseInt(m[1], 10)
      if (n > maxNum) maxNum = n
    }
  }
  return `${prefix}-${String(maxNum + 1).padStart(5, '0')}`
}

export async function GET(req: NextRequest) {
  try {
    await initDatabase()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (id) {
      const r = await db.execute({ sql: 'SELECT * FROM contracts WHERE id = ?', args: [id] })
      if (r.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const c = r.rows[0] as any
      const clientR = c.client_id
        ? await db.execute({ sql: 'SELECT * FROM clients WHERE id = ?', args: [c.client_id] })
        : { rows: [] }
      return NextResponse.json({
        contract: { ...c, items: JSON.parse(c.items || '[]'), client: clientR.rows[0] || null },
      })
    }

    const result = await db.execute(`
      SELECT c.*, cl.name as client_name
      FROM contracts c
      LEFT JOIN clients cl ON c.client_id = cl.id
      ORDER BY c.created_at DESC
    `)
    const rows = (result.rows as any[]).map((r) => ({
      ...r,
      items: JSON.parse(r.items || '[]'),
    }))
    return NextResponse.json({ contracts: rows })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await initDatabase()
    const body = await req.json()
    const id = body.id || crypto.randomUUID()
    const folio = body.folio || await nextFolio('CTR')

    const clientSnapshot = body.client ? JSON.stringify(body.client) : null

    await db.execute({
      sql: `INSERT INTO contracts
        (id, folio, client_id, client_snapshot, event_date, event_type, venue, start_time, end_time, guests,
         items, subtotal, deposit, balance, total, status, notes, terms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        folio,
        body.client_id || null,
        clientSnapshot,
        body.event_date,
        body.event_type || null,
        body.venue || null,
        body.start_time || null,
        body.end_time || null,
        body.guests || 0,
        JSON.stringify(body.items || []),
        body.subtotal || 0,
        body.deposit || 0,
        body.balance || 0,
        body.total || 0,
        body.status || 'draft',
        body.notes || null,
        body.terms || null,
      ],
    })

    const r = await db.execute({ sql: 'SELECT * FROM contracts WHERE id = ?', args: [id] })
    const c = r.rows[0] as any
    return NextResponse.json({
      contract: { ...c, items: JSON.parse(c.items || '[]') },
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
      sql: `UPDATE contracts SET
        client_id = ?, client_snapshot = ?, event_date = ?, event_type = ?, venue = ?,
        start_time = ?, end_time = ?, guests = ?, items = ?, subtotal = ?, deposit = ?, balance = ?,
        total = ?, status = ?, notes = ?, terms = ?, updated_at = datetime('now')
        WHERE id = ?`,
      args: [
        body.client_id || null,
        clientSnapshot,
        body.event_date,
        body.event_type || null,
        body.venue || null,
        body.start_time || null,
        body.end_time || null,
        body.guests || 0,
        JSON.stringify(body.items || []),
        body.subtotal || 0,
        body.deposit || 0,
        body.balance || 0,
        body.total || 0,
        body.status || 'draft',
        body.notes || null,
        body.terms || null,
        body.id,
      ],
    })

    const r = await db.execute({ sql: 'SELECT * FROM contracts WHERE id = ?', args: [body.id] })
    const c = r.rows[0] as any
    return NextResponse.json({
      contract: { ...c, items: JSON.parse(c.items || '[]') },
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
    await db.execute({ sql: 'DELETE FROM contracts WHERE id = ?', args: [id] })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
