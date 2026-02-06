import { cpSync, mkdirSync } from 'fs'
import { dirname } from 'path'

// Ensure directory exists
mkdirSync('dist-server/db', { recursive: true })

// Copy schema.sql to build output
cpSync('server/db/schema.sql', 'dist-server/db/schema.sql')

// Copy fonts for PDF generation
mkdirSync('dist-server/fonts', { recursive: true })
cpSync('server/fonts', 'dist-server/fonts', { recursive: true })

console.log('✓ Assets copied to dist-server (schema + fonts)')

