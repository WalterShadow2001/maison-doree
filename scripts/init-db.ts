import { initDatabase } from '../src/lib/db'

async function main() {
  console.log('Initializing Turso database for Maison Dorée...')
  await initDatabase()
  console.log('✓ Database initialized successfully')

  const { db } = await import('../src/lib/db')

  // Verify tables
  const tables = await db.execute(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
  console.log('\nTables:')
  for (const t of tables.rows) {
    console.log('  -', (t as any).name)
  }

  // Verify settings
  const settings = await db.execute(`SELECT key, value FROM settings`)
  console.log('\nSettings:')
  for (const s of settings.rows) {
    console.log(`  - ${(s as any).key}: ${(s as any).value}`)
  }

  process.exit(0)
}

main().catch(err => {
  console.error('Error initializing database:', err)
  process.exit(1)
})
