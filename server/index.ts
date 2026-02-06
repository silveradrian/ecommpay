import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import topicsRouter from './routes/topics.js'
import filesRouter from './routes/files.js'

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// API Routes
app.use('/api/topics', topicsRouter)
app.use('/api/topics', filesRouter)

// Health check endpoint
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Serve static files in production
// dist-server is at root, dist (frontend) is also at root
const distPath = path.join(__dirname, '../dist')
console.log('Static files path:', distPath)

app.use(express.static(distPath))

// Handle SPA routing - serve index.html for all non-API routes
// Express 5 requires named wildcard parameter
app.get('/{*path}', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'))
  }
})

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`)
})

export default app

