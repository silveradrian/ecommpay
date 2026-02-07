import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import pool from '../db/index.js'
// pdf-generator is imported dynamically in the generate-pdf endpoint
// to avoid crashing the entire router if pdfkit has loading issues

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
    const topicId = req.params.id as string
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

    values.push(id as string)

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
  } catch (error: any) {
    console.error('File upload error:', error?.message || error)
    console.error('File upload stack:', error?.stack)
    res.status(500).json({ error: 'Failed to upload files', detail: error?.message })
  }
})

// GET /api/topics/:id/files/:filename - Download a file
router.get('/:id/files/:filename', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const filename = req.params.filename as string

    // Validate filename to prevent directory traversal
    if (!['content.md', 'content.pdf'].includes(filename)) {
      return res.status(400).json({ error: 'Invalid filename' })
    }

    const filePath = path.join(TOPICS_DIR, id, filename)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' })
    }

    // Look up topic title for a meaningful download filename
    const ext = path.extname(filename)
    let downloadName = filename
    try {
      const result = await pool.query('SELECT topic FROM topics WHERE id = $1', [id])
      if (result.rows.length > 0 && result.rows[0].topic) {
        const slug = result.rows[0].topic
          .replace(/[^a-zA-Z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-')
          .toLowerCase()
          .slice(0, 80)
        downloadName = `${slug}${ext}`
      }
    } catch {
      // Fall back to generic filename if DB lookup fails
    }

    // Set appropriate content type
    const contentType = filename.endsWith('.pdf')
      ? 'application/pdf'
      : 'text/markdown'

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`)
    res.sendFile(filePath)
  } catch (error) {
    console.error('File download error:', error)
    res.status(500).json({ error: 'Failed to download file' })
  }
})

// POST /api/topics/:id/generate-pdf - Generate branded PDF from approved content
router.post('/:id/generate-pdf', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Fetch topic from database
    const result = await pool.query(
      `SELECT id, topic, category, priority, status, approved_content, approved_at
       FROM topics WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' })
    }

    const topic = result.rows[0]

    if (topic.status !== 'Approved' || !topic.approved_content) {
      return res.status(400).json({ error: 'Topic must be approved with content before generating PDF' })
    }

    // Ensure output directory exists
    const topicDir = path.join(TOPICS_DIR, id as string)
    ensureDir(topicDir)

    const pdfPath = path.join(topicDir, 'content.pdf')

    // Dynamic import to isolate pdfkit loading from the rest of the router
    const { generatePdf } = await import('../utils/pdf-generator.js')
    await generatePdf(pdfPath, {
      title: topic.topic,
      category: topic.category,
      priority: topic.priority,
      approvedAt: topic.approved_at,
      markdown: topic.approved_content,
    })

    // Update database with PDF file path
    const updateResult = await pool.query(
      `UPDATE topics SET pdf_file_path = $1 WHERE id = $2 RETURNING *`,
      [pdfPath, id]
    )

    console.log(`✓ PDF generated for topic ${id}: ${pdfPath}`)

    res.json({
      message: 'PDF generated successfully',
      topic: updateResult.rows[0],
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    res.status(500).json({ error: 'Failed to generate PDF' })
  }
})

export default router

