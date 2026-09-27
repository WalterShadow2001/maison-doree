import { NextRequest, NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await initDatabase()
    const result = await db.execute(
      'SELECT * FROM clients ORDER BY created_at DESC'
    )
    return NextResponse.json({ clients: result.rows })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await initDatabase()
    const body = await req.json()
    const id = crypto.randomUUID()
    await db.execute({
      sql: `INSERT INTO clients (id, name, type, email, phone, address, rfc, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        body.name,
        body.type || 'individual',
        body.email || null,
        body.phone || null,
        body.address || null,
        body.rfc || null,
        body.notes || null,
      ],
    })
    const result = await db.execute({
      sql: 'SELECT * FROM clients WHERE id = ?',
      args: [id],
    })
    return NextResponse.json({ client: result.rows[0] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await initDatabase()
    const body = await req.json()
    await db.execute({
      sql: `UPDATE clients SET
            name = ?, type = ?, email = ?, phone = ?, address = ?, rfc = ?, notes = ?,
            updated_at = datetime('now')
            WHERE id = ?`,
      args: [
        body.name,
        body.type || 'individual',
        body.email || null,
        body.phone || null,
        body.address || null,
        body.rfc || null,
        body.notes || null,
        body.id,
      ],
    })
    const result = await db.execute({
      sql: 'SELECT * FROM clients WHERE id = ?',
      args: [body.id],
    })
    return NextResponse.json({ client: result.rows[0] })
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
    await db.execute({ sql: 'DELETE FROM clients WHERE id = ?', args: [id] })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
