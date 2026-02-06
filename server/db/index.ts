import { Pool } from 'pg'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Support both DATABASE_URL and individual DB_* variables (Sevalla style)
const connectionString = process.env.DATABASE_URL || process.env.DB_URL

// Build config from individual vars if no connection string
const poolConfig = connectionString
  ? {
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }

const pool = new Pool(poolConfig)

// Auto-initialize database schema on startup
// Always runs schema.sql — all statements are idempotent (IF NOT EXISTS, ON CONFLICT DO NOTHING, etc.)
async function initializeDatabase() {
  try {
    console.log('Running database schema (idempotent)...')

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)

    const schemaPath = join(__dirname, 'schema.sql')
    const schema = readFileSync(schemaPath, 'utf-8')

    await pool.query(schema)
    console.log('✓ Database schema up to date')
  } catch (err) {
    console.error('✗ Database initialization error:', err instanceof Error ? err.message : err)
  }
}

// Initialize on startup
initializeDatabase()

export default pool

