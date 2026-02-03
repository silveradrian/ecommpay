import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import pool from '../db/index.js'

const router = Router()

// Storage directory - use /var/lib/data on Sevalla, local ./data for dev
const DATA_DIR = process.env.DATA_DIR || '/var/lib/data'
const TOPICS_DIR = path.join(DATA_DIR, 'topics')

// Ensure directory exists
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const topicId = req.params.id
    const topicDir = path.join(TOPICS_DIR, topicId)
    ensureDir(topicDir)
    cb(null, topicDir)
  },
  filename: (req, file, cb) => {
    // Use original extension but standardize name
    const ext = path.extname(file.originalname).toLowerCase()
    if (ext === '.md') {
      cb(null, 'content.md')
    } else if (ext === '.pdf') {
      cb(null, 'content.pdf')
    } else {
      cb(new Error('Only .md and .pdf files allowed'), '')
    }
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ext === '.md' || ext === '.pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only .md and .pdf files allowed'))
    }
  }
})

// POST /api/topics/:id/files - Upload MD and/or PDF files (called by n8n)
router.post('/:id/files', upload.fields([
  { name: 'md', maxCount: 1 },
  { name: 'pdf', maxCount: 1 }
]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    
    if (!files || ((!files.md || files.md.length === 0) && (!files.pdf || files.pdf.length === 0))) {
      return res.status(400).json({ error: 'No files uploaded. Use "md" and/or "pdf" form fields.' })
    }

    // Build update query
    const updates: string[] = []
    const values: (string | null)[] = []
    let paramCount = 1

    if (files.md && files.md.length > 0) {
      updates.push(`md_file_path = $${paramCount++}`)
      values.push(files.md[0].path)
    }

    if (files.pdf && files.pdf.length > 0) {
      updates.push(`pdf_file_path = $${paramCount++}`)
      values.push(files.pdf[0].path)
    }

    values.push(id)

    // Update database with file paths
    const result = await pool.query(
      `UPDATE topics SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' })
    }

    res.json({
      message: 'Files uploaded successfully',
      topic: result.rows[0]
    })
  } catch (error) {
    console.error('File upload error:', error)
    res.status(500).json({ error: 'Failed to upload files' })
  }
})

// GET /api/topics/:id/files/:filename - Download a file
router.get('/:id/files/:filename', async (req: Request, res: Response) => {
  try {
    const { id, filename } = req.params
    
    // Validate filename to prevent directory traversal
    if (!['content.md', 'content.pdf'].includes(filename)) {
      return res.status(400).json({ error: 'Invalid filename' })
    }

    const filePath = path.join(TOPICS_DIR, id, filename)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' })
    }

    // Set appropriate content type
    const contentType = filename.endsWith('.pdf') 
      ? 'application/pdf' 
      : 'text/markdown'

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.sendFile(filePath)
  } catch (error) {
    console.error('File download error:', error)
    res.status(500).json({ error: 'Failed to download file' })
  }
})

export default router

