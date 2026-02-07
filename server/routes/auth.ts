import { Router, Request, Response } from 'express'

const router = Router()

// Default credentials (override with environment variables)
const AUTH_USERNAME = process.env.AUTH_USERNAME || 'admin'
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'ecommpay2026'

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' })
  }

  if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
    // Set session
    ;(req.session as any).authenticated = true
    ;(req.session as any).username = username
    return res.json({ success: true, username })
  }

  return res.status(401).json({ error: 'Invalid username or password' })
})

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' })
    }
    res.clearCookie('connect.sid')
    return res.json({ success: true })
  })
})

// GET /api/auth/check - Check if user is authenticated
router.get('/check', (req: Request, res: Response) => {
  if ((req.session as any)?.authenticated) {
    return res.json({ authenticated: true, username: (req.session as any).username })
  }
  return res.status(401).json({ authenticated: false })
})

export default router

