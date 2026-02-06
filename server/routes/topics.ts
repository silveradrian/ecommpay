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

// POST /api/topics/:id/add-to-customgpt - Upload approved content to CustomGPT (Savi) knowledge base
router.post('/:id/add-to-customgpt', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Validate environment variables
    const apiKey = process.env.CUSTOMGPT_API
    const projectId = process.env.CUSTOMGPT_PROJECT_ID

    if (!apiKey || !projectId) {
      console.error('CUSTOMGPT_API or CUSTOMGPT_PROJECT_ID not configured')
      return res.status(500).json({ error: 'Savi integration not configured' })
    }

    // Fetch the topic
    const result = await pool.query('SELECT * FROM topics WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' })
    }

    const topic = result.rows[0]

    if (topic.status !== 'Approved' || !topic.approved_content) {
      return res.status(400).json({ error: 'Topic must be approved with content before submitting to Savi' })
    }

    // Build markdown file with metadata header
    const fileName = `${topic.topic.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase().slice(0, 80)}.md`
    const fileContent = `---
title: ${topic.topic}
category: ${topic.category || 'Uncategorized'}
approved_at: ${topic.approved_at || new Date().toISOString()}
source: Ecommpay Knowledge Pipeline
---

${topic.approved_content}`

    // Upload to CustomGPT Sources as multipart/form-data
    const formData = new FormData()
    formData.append('file', new Blob([fileContent], { type: 'text/markdown' }), fileName)

    const uploadUrl = `https://app.customgpt.ai/api/v1/projects/${projectId}/sources`
    console.log(`Uploading to CustomGPT: ${fileName}`)

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: formData,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('CustomGPT upload error:', uploadResponse.status, errorText)
      return res.status(502).json({ error: 'Failed to upload content to Savi' })
    }

    const uploadData = await uploadResponse.json()
    const sourceId = uploadData.data?.id || uploadData.id

    if (!sourceId) {
      console.error('CustomGPT upload returned no source ID:', JSON.stringify(uploadData))
      return res.status(502).json({ error: 'Savi upload succeeded but returned no source ID' })
    }

    console.log(`CustomGPT upload success, source ID: ${sourceId}`)

    // Trigger reindex for reliability
    try {
      const reindexUrl = `https://app.customgpt.ai/api/v1/projects/${projectId}/sources/${sourceId}/reindex`
      await fetch(reindexUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
    } catch (reindexErr) {
      console.warn('Reindex request failed (non-critical):', reindexErr)
    }

    // Update database with source ID and timestamp
    await pool.query(
      'UPDATE topics SET customgpt_source_id = $1, customgpt_added_at = NOW() WHERE id = $2',
      [String(sourceId), id]
    )

    res.json({ success: true, message: 'Content added to Savi knowledge base' })
  } catch (error) {
    console.error('Error adding to Savi:', error)
    res.status(500).json({ error: 'Failed to add to Savi' })
  }
})

export default router

