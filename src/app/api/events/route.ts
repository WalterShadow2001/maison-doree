import { NextRequest, NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    await initDatabase()
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    let sql = `
      SELECT e.*, c.name as client_name
      FROM events e
      LEFT JOIN clients c ON e.client_id = c.id
    `
    const args: any[] = []
    if (from && to) {
      sql += ' WHERE e.date >= ? AND e.date <= ?'
      args.push(from, to)
    }
    sql += ' ORDER BY e.date ASC, e.start_time ASC'

    const result = await db.execute({ sql, args })
    return NextResponse.json({ events: result.rows })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await initDatabase()
    const body = await req.json()
    const id = body.id || crypto.randomUUID()
    await db.execute({
      sql: `INSERT INTO events
        (id, title, client_id, date, start_time, end_time, type, status, venue, notes, color, contract_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        body.title,
        body.client_id || null,
        body.date,
        body.start_time || null,
        body.end_time || null,
        body.type || null,
        body.status || 'scheduled',
        body.venue || null,
        body.notes || null,
        body.color || '#C9A961',
        body.contract_id || null,
      ],
    })

    const r = await db.execute({ sql: 'SELECT * FROM events WHERE id = ?', args: [id] })
    return NextResponse.json({ event: r.rows[0] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await initDatabase()
    const body = await req.json()
    await db.execute({
      sql: `UPDATE events SET
        title = ?, client_id = ?, date = ?, start_time = ?, end_time = ?, type = ?,
        status = ?, venue = ?, notes = ?, color = ?, contract_id = ?,
        updated_at = datetime('now')
        WHERE id = ?`,
      args: [
        body.title,
        body.client_id || null,
        body.date,
        body.start_time || null,
        body.end_time || null,
        body.type || null,
        body.status || 'scheduled',
        body.venue || null,
        body.notes || null,
        body.color || '#C9A961',
        body.contract_id || null,
        body.id,
      ],
    })
    const r = await db.execute({ sql: 'SELECT * FROM events WHERE id = ?', args: [body.id] })
    return NextResponse.json({ event: r.rows[0] })
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
    await db.execute({ sql: 'DELETE FROM events WHERE id = ?', args: [id] })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
