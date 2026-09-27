import { NextRequest, NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'
import { generateContractPDF, getBusinessInfo } from '@/lib/pdf'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    await initDatabase()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const r = await db.execute({ sql: 'SELECT * FROM contracts WHERE id = ?', args: [id] })
    if (r.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const c = r.rows[0] as any
    let client = null
    if (c.client_snapshot) {
      try { client = JSON.parse(c.client_snapshot) } catch {}
    }
    if (!client && c.client_id) {
      const cl = await db.execute({ sql: 'SELECT * FROM clients WHERE id = ?', args: [c.client_id] })
      client = cl.rows[0]
    }

    const business = await getBusinessInfo(db)

    const doc = generateContractPDF({
      folio: c.folio,
      date: c.created_at,
      client: {
        name: client?.name || 'Cliente General',
        email: client?.email || '',
        phone: client?.phone || '',
        address: client?.address || '',
        rfc: client?.rfc || '',
      },
      eventDate: c.event_date,
      eventType: c.event_type,
      venue: c.venue,
      startTime: c.start_time,
      endTime: c.end_time,
      guests: c.guests,
      items: JSON.parse(c.items || '[]'),
      subtotal: c.subtotal,
      deposit: c.deposit,
      balance: c.balance,
      total: c.total,
      notes: c.notes,
      terms: c.terms,
    }, business)

    const buf = doc.output('arraybuffer')
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contrato-${c.folio}.pdf"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
