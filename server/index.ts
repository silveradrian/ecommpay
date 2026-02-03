import express from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import topicsRouter from './routes/topics.js'
import filesRouter from './routes/files.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// API Routes
app.use('/api/topics', topicsRouter)
app.use('/api/topics', filesRouter)

// Health check endpoint
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
  
  // Handle SPA routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../dist/index.html'))
    }
  })
}

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`)
})

export default app

