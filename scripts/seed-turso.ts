import { db, initDatabase } from '../src/lib/db'

async function main() {
  await initDatabase()

  // Insert events
  const events = [
    { id: crypto.randomUUID(), title: 'Boda Cortés-Ruiz', date: '2026-12-15', start: '13:00', end: '20:00', type: 'Boda', status: 'confirmed', venue: 'Salón Cristal', notes: 'Confirmar 7 días antes', color: '#C9A961' },
    { id: crypto.randomUUID(), title: 'XV Años Valentina', date: '2026-10-25', start: '19:00', end: '23:00', type: 'XV Años', status: 'scheduled', venue: 'Salón Real', notes: '', color: '#E8C97C' },
    { id: crypto.randomUUID(), title: 'Bautizo Mateo', date: '2026-11-08', start: '14:00', end: '18:00', type: 'Bautizo', status: 'scheduled', venue: 'Casa particular', notes: '', color: '#9FB7D4' },
    { id: crypto.randomUUID(), title: 'Boda Mendoza-Pérez', date: '2026-11-22', start: '16:00', end: '23:00', type: 'Boda', status: 'scheduled', venue: 'Hacienda San Andrés', notes: 'Cita de prueba el 20/11', color: '#C9A961' },
    { id: crypto.randomUUID(), title: 'Evento Corporativo TechCorp', date: '2026-10-30', start: '09:00', end: '17:00', type: 'Corporativo', status: 'scheduled', venue: 'Hotel Real de Chapultepec', notes: 'Coffee break incluido', color: '#7B8B6F' },
  ]
  for (const e of events) {
    await db.execute({
      sql: `INSERT INTO events (id, title, date, start_time, end_time, type, status, venue, notes, color)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [e.id, e.title, e.date, e.start, e.end, e.type, e.status, e.venue, e.notes || null, e.color],
    })
  }
  console.log(`✓ Inserted ${events.length} events`)

  // Create a sample quotation
  const qId = crypto.randomUUID()
  const client = { name: 'Weddings & Co. Eventos', email: 'eventos@weddingsco.mx', phone: '+52 555 222 3344', address: 'Reforma 888, CDMX', rfc: 'WCO120715KJ1' }
  const qItems = [
    { name: 'Plato Llano Dorado 27cm', description: 'Porcelana con borde dorado', quantity: 150, unitPrice: 85 },
    { name: 'Copa Vino Cristal Bohemia', description: 'Copa de cristal cortado 350ml', quantity: 150, unitPrice: 120 },
    { name: 'Cubierto 5 Piezas Acero Dorado', description: 'Set completo cuchara/tenedor/cuchillo', quantity: 150, unitPrice: 180 },
    { name: 'Centro de Mesa Esfera Dorada', description: 'Esfera decorativa 30cm', quantity: 8, unitPrice: 350 },
  ]
  const qSubtotal = qItems.reduce((s, it) => s + it.quantity * it.unitPrice, 0)
  const qDiscount = 1500
  const qBase = qSubtotal - qDiscount
  const qIva = qBase * 0.16
  const qTotal = qBase + qIva

  await db.execute({
    sql: `INSERT INTO quotations
      (id, folio, client_id, client_snapshot, date, valid_until, status, items, subtotal, discount, iva_rate, iva, total, notes, payment_terms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      qId,
      'COT-00001',
      null,
      JSON.stringify(client),
      '2026-09-27',
      '2026-10-12',
      'sent',
      JSON.stringify(qItems),
      qSubtotal,
      qDiscount,
      0.16,
      qIva,
      qTotal,
      'Cotización para boda de 150 invitados. Mercancía sujeta a disponibilidad al confirmar.',
      '50% anticipo al confirmar la fecha. Saldo contra entrega.\nTransferencia o efectivo.\nVigencia: 15 días.',
    ],
  })
  console.log(`✓ Created quotation COT-00001 (${qTotal.toFixed(2)} MXN)`)

  // Create a sample contract
  const cId = crypto.randomUUID()
  const cClient = { name: 'María Fernanda Cortés Ruiz', email: 'fer.cortes@gmail.com', phone: '+52 555 123 4567', address: 'Polanco 1234, CDMX', rfc: 'CORF890215AB1' }
  const cItems = [
    { name: 'Plato Llano Dorado 27cm', description: 'Porcelana con borde dorado', quantity: 100, unitPrice: 85 },
    { name: 'Plato Hondo Royale 24cm', description: 'Porcelana elegante para sopa', quantity: 100, unitPrice: 95 },
    { name: 'Copa Vino Cristal Bohemia', description: 'Copa de cristal cortado 350ml', quantity: 100, unitPrice: 120 },
    { name: 'Copa Champagne Flauta', description: 'Copa alta para champagne 220ml', quantity: 100, unitPrice: 110 },
    { name: 'Cubierto 5 Piezas Acero Dorado', description: 'Set completo', quantity: 100, unitPrice: 180 },
  ]
  const cSubtotal = cItems.reduce((s, it) => s + it.quantity * it.unitPrice, 0)
  const cDeposit = cSubtotal * 0.5
  const cBalance = cSubtotal - cDeposit
  const cTotal = cSubtotal

  await db.execute({
    sql: `INSERT INTO contracts
      (id, folio, client_id, client_snapshot, event_date, event_type, venue, start_time, end_time, guests,
       items, subtotal, deposit, balance, total, status, notes, terms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      cId,
      'CTR-00001',
      null,
      JSON.stringify(cClient),
      '2026-12-15',
      'Boda',
      'Salón Cristal, Av. Reforma 4567, CDMX',
      '13:00',
      '20:00',
      100,
      JSON.stringify(cItems),
      cSubtotal,
      cDeposit,
      cBalance,
      cTotal,
      'active',
      'Incluye montaje y desmontaje. Personal de servicio no incluido.',
      '',
    ],
  })
  console.log(`✓ Created contract CTR-00001 (${cTotal.toFixed(2)} MXN)`)

  // Final counts
  for (const t of ['products', 'clients', 'quotations', 'contracts', 'events', 'settings']) {
    const r = await db.execute(`SELECT COUNT(*) as c FROM ${t}`)
    console.log(`  ${t}: ${r.rows[0]?.c || 0}`)
  }
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
