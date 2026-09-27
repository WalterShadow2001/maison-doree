import { NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await initDatabase()

    const productsR = await db.execute('SELECT COUNT(*) as c, COALESCE(SUM(stock),0) as stock FROM products WHERE active = 1')
    const clientsR = await db.execute('SELECT COUNT(*) as c FROM clients')
    const quotationsR = await db.execute("SELECT COUNT(*) as c, COALESCE(SUM(total),0) as total FROM quotations WHERE status != 'cancelled'")
    const contractsR = await db.execute("SELECT COUNT(*) as c, COALESCE(SUM(total),0) as total FROM contracts WHERE status != 'cancelled'")
    const eventsR = await db.execute(
      `SELECT COUNT(*) as c FROM events WHERE date >= date('now')`
    )

    // Recent items
    const recentQuotations = await db.execute(`
      SELECT q.id, q.folio, q.date, q.total, q.status, q.client_id, COALESCE(c.name,'—') as client_name
      FROM quotations q LEFT JOIN clients c ON q.client_id = c.id
      ORDER BY q.created_at DESC LIMIT 5
    `)
    const upcomingEvents = await db.execute(`
      SELECT e.id, e.title, e.date, e.start_time, e.venue, e.type, COALESCE(c.name,'—') as client_name
      FROM events e LEFT JOIN clients c ON e.client_id = c.id
      WHERE e.date >= date('now')
      ORDER BY e.date ASC LIMIT 5
    `)

    // Monthly revenue (last 6 months)
    const revenueR = await db.execute(`
      SELECT strftime('%Y-%m', date) as month, COALESCE(SUM(total),0) as total
      FROM quotations WHERE status != 'cancelled' AND date >= date('now','-6 months')
      GROUP BY month ORDER BY month ASC
    `)

    // Inventory alerts
    const lowStock = await db.execute(
      'SELECT name, stock FROM products WHERE active = 1 AND stock <= 5 ORDER BY stock ASC'
    )

    const p = productsR.rows[0] as any
    const cl = clientsR.rows[0] as any
    const q = quotationsR.rows[0] as any
    const ct = contractsR.rows[0] as any
    const ev = eventsR.rows[0] as any

    return NextResponse.json({
      stats: {
        products: p?.c || 0,
        totalStock: p?.stock || 0,
        clients: cl?.c || 0,
        quotations: q?.c || 0,
        quotationsTotal: q?.total || 0,
        contracts: ct?.c || 0,
        contractsTotal: ct?.total || 0,
        upcomingEvents: ev?.c || 0,
      },
      recentQuotations: recentQuotations.rows,
      upcomingEvents: upcomingEvents.rows,
      revenueByMonth: revenueR.rows,
      lowStock: lowStock.rows,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
