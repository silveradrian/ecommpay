import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import dotenv from 'dotenv'
import { Pool } from 'pg'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function initDatabase() {
  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    console.error('✗ DATABASE_URL environment variable is not set')
    process.exit(1)
  }
  
  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })
  
  try {
    console.log('Connecting to database...')
    
    // Read and execute schema
    const schemaPath = join(__dirname, 'schema.sql')
    const schema = readFileSync(schemaPath, 'utf-8')
    
    console.log('Running schema...')
    await pool.query(schema)
    
    console.log('✓ Database initialized successfully')
  } catch (error) {
    console.error('✗ Failed to initialize database:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

initDatabase()

