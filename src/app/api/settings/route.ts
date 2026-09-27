import { NextRequest, NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await initDatabase()
    const result = await db.execute('SELECT key, value FROM settings')
    const map: Record<string, string> = {}
    for (const r of result.rows) {
      map[(r as any).key] = (r as any).value
    }
    return NextResponse.json({ settings: map })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await initDatabase()
    const body = await req.json()
    for (const [key, value] of Object.entries(body)) {
      await db.execute({
        sql: `INSERT INTO settings (key, value) VALUES (?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        args: [key, String(value)],
      })
    }
    const result = await db.execute('SELECT key, value FROM settings')
    const map: Record<string, string> = {}
    for (const r of result.rows) {
      map[(r as any).key] = (r as any).value
    }
    return NextResponse.json({ settings: map })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
