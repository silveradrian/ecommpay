import { Pool } from 'pg'

// Use internal Sevalla URL when deployed, external for local dev
const connectionString = process.env.DATABASE_URL

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

// Test connection on startup
pool.query('SELECT NOW()')
  .then(() => console.log('✓ Database connected'))
  .catch((err) => console.error('✗ Database connection error:', err.message))

export default pool

