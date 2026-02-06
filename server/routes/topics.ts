import { Router, Request, Response } from 'express'
import pool from '../db/index.js'

const router = Router()

// GET /api/topics - List all topics
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, topic, category, priority, status, created_at, updated_at, approved_at
      FROM topics
      ORDER BY created_at DESC
    `)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching topics:', error)
    res.status(500).json({ error: 'Failed to fetch topics' })
  }
})

// GET /api/topics/:id - Get single topic with content
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      'SELECT * FROM topics WHERE id = $1',
      [id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching topic:', error)
    res.status(500).json({ error: 'Failed to fetch topic' })
  }
})

// POST /api/topics - Create new topic (called by frontend or n8n)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { topic, category, priority } = req.body
    
    if (!topic || typeof topic !== 'string' || topic.trim() === '') {
      return res.status(400).json({ error: 'Topic is required' })
    }
    
    const result = await pool.query(
      `INSERT INTO topics (topic, category, priority)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [topic.trim(), category?.trim() || null, priority || 'medium']
    )
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating topic:', error)
    res.status(500).json({ error: 'Failed to create topic' })
  }
})

// PATCH /api/topics/:id - Update topic (called by n8n to update status/content)
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status, approved_content, customgpt_source_id, customgpt_added_at } = req.body
    
    // Build dynamic update query
    const updates: string[] = []
    const values: (string | null)[] = []
    let paramCount = 1
    
    if (status !== undefined) {
      const validStatuses = ['Queued', 'In Progress', 'In Review', 'Approved', 'Rejected']
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' })
      }
      updates.push(`status = $${paramCount++}`)
      values.push(status)
    }
    
    if (approved_content !== undefined) {
      updates.push(`approved_content = $${paramCount++}`)
      values.push(approved_content)
    }
    
    if (customgpt_source_id !== undefined) {
      updates.push(`customgpt_source_id = $${paramCount++}`)
      values.push(customgpt_source_id)
    }
    
    if (customgpt_added_at !== undefined) {
      updates.push(`customgpt_added_at = $${paramCount++}`)
      values.push(customgpt_added_at)
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    values.push(id as string)
    const result = await pool.query(
      `UPDATE topics SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating topic:', error)
    res.status(500).json({ error: 'Failed to update topic' })
  }
})

// DELETE /api/topics/:id - Delete a topic
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      'DELETE FROM topics WHERE id = $1 RETURNING id, topic',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' })
    }

    res.json({ success: true, deleted: result.rows[0] })
  } catch (error) {
    console.error('Error deleting topic:', error)
    res.status(500).json({ error: 'Failed to delete topic' })
  }
})

// POST /api/topics/:id/add-to-customgpt - Trigger n8n workflow to add content to customGPT
router.post('/:id/add-to-customgpt', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    // Fetch the topic to get approved content
    const result = await pool.query(
      'SELECT * FROM topics WHERE id = $1',
      [id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' })
    }
    
    const topic = result.rows[0]
    
    if (topic.status !== 'Approved' || !topic.approved_content) {
      return res.status(400).json({ error: 'Topic must be approved with content before adding to customGPT' })
    }
    
    // Get n8n webhook URL from environment
    const n8nWebhookUrl = process.env.N8N_CUSTOMGPT_WEBHOOK_URL
    
    if (!n8nWebhookUrl) {
      console.error('N8N_CUSTOMGPT_WEBHOOK_URL not configured')
      return res.status(500).json({ error: 'CustomGPT integration not configured' })
    }
    
    // Trigger n8n workflow via webhook
    const webhookResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic_id: topic.id,
        topic: topic.topic,
        category: topic.category,
        content: topic.approved_content,
        approved_at: topic.approved_at,
      }),
    })
    
    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      console.error('n8n webhook error:', errorText)
      return res.status(500).json({ error: 'Failed to trigger customGPT workflow' })
    }
    
    res.json({ success: true, message: 'Content queued for addition to customGPT knowledge base' })
  } catch (error) {
    console.error('Error adding to customGPT:', error)
    res.status(500).json({ error: 'Failed to add to customGPT' })
  }
})

export default router

