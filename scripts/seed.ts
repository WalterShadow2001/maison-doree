import { db, initDatabase } from '../src/lib/db'

const SAMPLE_PRODUCTS = [
  { name: 'Plato Llano Dorado 27cm', description: 'Porcelana con borde dorado', category: 'Platos', sku: 'PL-DOR-27', price: 85, cost: 45, stock: 240 },
  { name: 'Plato Hondo Royale 24cm', description: 'Porcelana elegante para sopa', category: 'Platos', sku: 'PL-HON-24', price: 95, cost: 52, stock: 180 },
  { name: 'Plato Postre Imperial 19cm', description: 'Para postres y entradas', category: 'Platos', sku: 'PL-POS-19', price: 65, cost: 32, stock: 320 },
  { name: 'Copa Vino Cristal Bohemia', description: 'Copa de cristal cortado 350ml', category: 'Copas', sku: 'CP-VIN-350', price: 120, cost: 65, stock: 200 },
  { name: 'Copa Champagne Flauta', description: 'Copa alta para champagne 220ml', category: 'Copas', sku: 'CP-CHA-220', price: 110, cost: 58, stock: 150 },
  { name: 'Copa Agua Crystalline', description: 'Copa grande para agua 420ml', category: 'Copas', sku: 'CP-AGU-420', price: 105, cost: 55, stock: 180 },
  { name: 'Taza Café Porcelana Royal', description: 'Juego de taza con platillo 250ml', category: 'Tazas', sku: 'TZ-CAF-250', price: 75, cost: 38, stock: 280 },
  { name: 'Taza Té Imperial', description: 'Taza con platillo para té 200ml', category: 'Tazas', sku: 'TZ-TE-200', price: 70, cost: 35, stock: 220 },
  { name: 'Cubierto 5 Piezas Acero Dorado', description: 'Cuchara, tenedor, cuchillo, postre, café', category: 'Cubiertos', sku: 'CB-5P-DOR', price: 180, cost: 95, stock: 100 },
  { name: 'Servilletero Plata Vintage', description: 'Anillo servilletero de plata', category: 'Accesorios', sku: 'AC-SER-PLT', price: 45, cost: 22, stock: 80 },
  { name: 'Cenicero Cristal Vintage', description: 'Cenicero de cristal tallado', category: 'Accesorios', sku: 'AC-CEN-CRIS', price: 65, cost: 30, stock: 60 },
  { name: 'Centro de Mesa Esfera Dorada', description: 'Esfera decorativa dorada 30cm', category: 'Decoración', sku: 'DC-CM-ESP30', price: 350, cost: 180, stock: 25 },
  { name: 'Candelabro 3 Brazos Bronce', description: 'Candelabro elegante para mesa principal', category: 'Decoración', sku: 'DC-CDL-3B', price: 480, cost: 240, stock: 15 },
  { name: 'Mantel Lino Premium 3x1.5m', description: 'Mantel de lino color marfil', category: 'Textiles', sku: 'TX-MAN-300', price: 220, cost: 110, stock: 40 },
  { name: 'Servilleta Lino Set 12', description: 'Servilletas de lino coordinadas', category: 'Textiles', sku: 'TX-SER-12', price: 180, cost: 90, stock: 50 },
  { name: 'Bandeja Plata Ovalada Grande', description: 'Bandeja de plata para servicio', category: 'Servicio', sku: 'SV-BND-OV-G', price: 280, cost: 140, stock: 30 },
  { name: 'Jarra Cristal Tallada 1.5L', description: 'Jarra de cristal tallado para agua', category: 'Servicio', sku: 'SV-JAR-15', price: 195, cost: 100, stock: 45 },
  { name: 'Salero Pimentero Cristal', description: 'Set de salero y pimentero de cristal', category: 'Servicio', sku: 'SV-SAL-CR', price: 85, cost: 40, stock: 75 },
]

const SAMPLE_CLIENTS = [
  { name: 'Banquetes Delicias Mexicanas SA de CV', type: 'business', email: 'contacto@deliciasmx.com', phone: '+52 555 987 6543', address: 'Av. Insurgentes Sur 4567, CDMX', rfc: 'BDM950715KJ1' },
  { name: 'María Fernanda Cortés Ruiz', type: 'individual', email: 'fer.cortes@gmail.com', phone: '+52 555 123 4567', address: 'Polanco 1234, CDMX', rfc: 'CORF890215AB1' },
  { name: 'Weddings & Co. Eventos', type: 'business', email: 'eventos@weddingsco.mx', phone: '+52 555 222 3344', address: 'Reforma 888, CDMX', rfc: 'WCO120715KJ1' },
  { name: 'Jorge Luis Mendoza Pérez', type: 'individual', email: 'jlmendoza@hotmail.com', phone: '+52 555 666 7788', address: 'Coyoacán 456, CDMX', rfc: 'MEPJ780315CD2' },
  { name: 'Hotel Real de Chapultepec', type: 'business', email: 'eventos@realchapultepec.mx', phone: '+52 555 444 5566', address: 'Chapultepec 1100, CDMX', rfc: 'HRC950715KJ1' },
]

async function seed() {
  await initDatabase()

  // Check if products table already has data
  const existing = await db.execute('SELECT COUNT(*) as c FROM products')
  if ((existing.rows[0] as any).c > 0) {
    console.log('Products already exist, skipping seed')
    return
  }

  console.log('Seeding sample products...')
  for (const p of SAMPLE_PRODUCTS) {
    const id = crypto.randomUUID()
    await db.execute({
      sql: `INSERT INTO products (id, name, description, category, sku, price, cost, stock, active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      args: [id, p.name, p.description, p.category, p.sku, p.price, p.cost, p.stock],
    })
  }
  console.log(`✓ Inserted ${SAMPLE_PRODUCTS.length} products`)

  console.log('Seeding sample clients...')
  for (const c of SAMPLE_CLIENTS) {
    const id = crypto.randomUUID()
    await db.execute({
      sql: `INSERT INTO clients (id, name, type, email, phone, address, rfc)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, c.name, c.type, c.email, c.phone, c.address, c.rfc],
    })
  }
  console.log(`✓ Inserted ${SAMPLE_CLIENTS.length} clients`)

  console.log('Seed completed successfully')
}

seed().catch(err => {
  console.error('Seed error:', err)
  process.exit(1)
})
