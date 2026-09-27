import { NextRequest, NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'
import { generateQuotationPDF, getBusinessInfo } from '@/lib/pdf'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    await initDatabase()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const r = await db.execute({ sql: 'SELECT * FROM quotations WHERE id = ?', args: [id] })
    if (r.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const q = r.rows[0] as any
    let client = null
    if (q.client_snapshot) {
      try { client = JSON.parse(q.client_snapshot) } catch {}
    }
    if (!client && q.client_id) {
      const c = await db.execute({ sql: 'SELECT * FROM clients WHERE id = ?', args: [q.client_id] })
      client = c.rows[0]
    }

    const business = await getBusinessInfo(db)

    const doc = generateQuotationPDF({
      folio: q.folio,
      date: q.date,
      validUntil: q.valid_until,
      client: {
        name: client?.name || 'Cliente General',
        email: client?.email || '',
        phone: client?.phone || '',
        address: client?.address || '',
        rfc: client?.rfc || '',
      },
      items: JSON.parse(q.items || '[]'),
      subtotal: q.subtotal,
      discount: q.discount,
      ivaRate: q.iva_rate,
      iva: q.iva,
      total: q.total,
      notes: q.notes,
      paymentTerms: q.payment_terms,
    }, business)

    const buf = doc.output('arraybuffer')
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cotizacion-${q.folio}.pdf"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
