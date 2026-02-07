import express from 'express'
import cors from 'cors'
import session from 'express-session'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import topicsRouter from './routes/topics.js'
import filesRouter from './routes/files.js'
import settingsRouter from './routes/settings.js'
import authRouter from './routes/auth.js'

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'ecommpay-knowledge-pipeline-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}))

// Auth routes (public - no auth required)
app.use('/api/auth', authRouter)

// Health check endpoint (public)
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Auth middleware - protect all other /api routes
app.use('/api', (req, res, next) => {
  if ((req.session as any)?.authenticated) {
    return next()
  }
  return res.status(401).json({ error: 'Not authenticated' })
})

// Protected API Routes
app.use('/api/topics', topicsRouter)
app.use('/api/topics', filesRouter)
app.use('/api/settings', settingsRouter)

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

