import { Pool } from 'pg'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Use internal Sevalla URL when deployed, external for local dev
const connectionString = process.env.DATABASE_URL

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

// Auto-initialize database schema on startup
async function initializeDatabase() {
  try {
    // Check if topics table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'topics'
      )
    `)

    if (!tableCheck.rows[0].exists) {
      console.log('Initializing database schema...')

      // Get the directory path for ES modules
      const __filename = fileURLToPath(import.meta.url)
      const __dirname = dirname(__filename)

      const schemaPath = join(__dirname, 'schema.sql')
      const schema = readFileSync(schemaPath, 'utf-8')

      await pool.query(schema)
      console.log('✓ Database schema initialized')
    } else {
      console.log('✓ Database connected (schema exists)')
    }
  } catch (err) {
    console.error('✗ Database initialization error:', err instanceof Error ? err.message : err)
  }
}

// Initialize on startup
initializeDatabase()

export default pool

