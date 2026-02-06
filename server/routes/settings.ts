import { Router, Request, Response } from 'express'
import pool from '../db/index.js'

const router = Router()

// Allowed setting keys (whitelist for safety)
const ALLOWED_KEYS = ['perplexity_system_prompt']

// GET /api/settings/:key - Get a setting value
router.get('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params

    if (!ALLOWED_KEYS.includes(key)) {
      return res.status(400).json({ error: 'Invalid setting key' })
    }

    const result = await pool.query(
      'SELECT key, value, updated_at FROM settings WHERE key = $1',
      [key]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching setting:', error)
    res.status(500).json({ error: 'Failed to fetch setting' })
  }
})

// PUT /api/settings/:key - Update a setting value
router.put('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params
    const { value } = req.body

    if (!ALLOWED_KEYS.includes(key)) {
      return res.status(400).json({ error: 'Invalid setting key' })
    }

    if (value === undefined || typeof value !== 'string') {
      return res.status(400).json({ error: 'Value is required and must be a string' })
    }

    if (value.trim() === '') {
      return res.status(400).json({ error: 'Value cannot be empty' })
    }

    const result = await pool.query(
      `INSERT INTO settings (key, value, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
       RETURNING key, value, updated_at`,
      [key, value.trim()]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating setting:', error)
    res.status(500).json({ error: 'Failed to update setting' })
  }
})

export default router

