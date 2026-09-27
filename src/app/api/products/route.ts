import { NextRequest, NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await initDatabase()
    const result = await db.execute(
      'SELECT * FROM products ORDER BY created_at DESC'
    )
    return NextResponse.json({ products: result.rows })
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
      sql: `INSERT INTO products (id, name, description, category, sku, price, cost, stock, image_url, active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      args: [
        id,
        body.name,
        body.description || null,
        body.category || null,
        body.sku || null,
        body.price || 0,
        body.cost || 0,
        body.stock || 0,
        body.image_url || null,
      ],
    })
    const result = await db.execute({
      sql: 'SELECT * FROM products WHERE id = ?',
      args: [id],
    })
    return NextResponse.json({ product: result.rows[0] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await initDatabase()
    const body = await req.json()
    await db.execute({
      sql: `UPDATE products SET
            name = ?, description = ?, category = ?, sku = ?, price = ?, cost = ?, stock = ?,
            image_url = ?, active = ?, updated_at = datetime('now')
            WHERE id = ?`,
      args: [
        body.name,
        body.description || null,
        body.category || null,
        body.sku || null,
        body.price || 0,
        body.cost || 0,
        body.stock || 0,
        body.image_url || null,
        body.active ? 1 : 0,
        body.id,
      ],
    })
    const result = await db.execute({
      sql: 'SELECT * FROM products WHERE id = ?',
      args: [body.id],
    })
    return NextResponse.json({ product: result.rows[0] })
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
    await db.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [id] })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
