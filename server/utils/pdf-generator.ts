import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Resolve asset paths (works in both dev and production)
function resolveAsset(relativePath: string): string {
  // In dev: server/utils/ -> server/fonts/
  // In prod: dist-server/utils/ -> dist-server/fonts/
  return path.join(__dirname, '..', relativePath)
}

function resolvePublicAsset(relativePath: string): string {
  // In dev: server/utils/ -> public/img/
  // In prod: dist-server/utils/ -> dist/img/
  const devPath = path.join(__dirname, '../../public', relativePath)
  const prodPath = path.join(__dirname, '../dist', relativePath)
  if (fs.existsSync(devPath)) return devPath
  if (fs.existsSync(prodPath)) return prodPath
  // Fallback: check relative to dist (production layout)
  const altProdPath = path.join(__dirname, '../../dist', relativePath)
  if (fs.existsSync(altProdPath)) return altProdPath
  return devPath // return dev path even if missing, let caller handle error
}

// Ecommpay Brand Colors
const COLORS = {
  ecommpayPurple: '#4B007C',    // Primary brand color
  newWorldPurple: '#AD00FD',    // Vibrant accent
  ecommpayLilac: '#AE91FF',     // Secondary accent
  highEndOrange: '#FF5F00',     // Accent / CTA
  financialGreen: '#102E19',    // Trust / stability
  ecommpayBlack: '#060316',     // Primary text
  beige: '#F8F4F2',             // Light background
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  mediumGray: '#666666',
  darkGray: '#333333',
}

// PDF layout constants
const PAGE = {
  width: 595.28,   // A4
  height: 841.89,  // A4
  marginLeft: 60,
  marginRight: 60,
  marginTop: 80,
  marginBottom: 70,
  contentWidth: 595.28 - 120, // width - marginLeft - marginRight
}

interface PdfOptions {
  title: string
  category?: string | null
  approvedAt?: string | null
  markdown: string
}

// Table data structure
interface TableData {
  headers: string[]
  rows: string[][]
}

// TOC entry collected during content rendering
interface TocEntry {
  text: string
  level: number  // 1 = h1, 2 = h2, 3 = h3
  page: number
}

// Simple markdown line parser
interface ParsedLine {
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'paragraph' | 'bullet' | 'numbered' | 'hr' | 'blank' | 'bold-line' | 'code' | 'table' | 'blockquote'
  text: string
  indent?: number
  table?: TableData
}

// Helper: parse a markdown table row into cell strings
function parseTableRow(line: string): string[] {
  return line.split('|').slice(1, -1).map(cell => cell.trim())
}

// Helper: check if a line is a table separator (e.g. |---|---|)
function isTableSeparator(line: string): boolean {
  return /^\|[\s:]*-+[\s:]*(\|[\s:]*-+[\s:]*)*\|$/.test(line.trim())
}

function parseMarkdownLines(markdown: string): ParsedLine[] {
  const lines = markdown.split('\n')
  const parsed: ParsedLine[] = []
  let inCodeBlock = false
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      i++
      continue
    }

    if (inCodeBlock) {
      parsed.push({ type: 'code', text: line })
      i++
      continue
    }

    // Detect markdown tables: line starts with | and contains at least one more |
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.indexOf('|', 1) > 0) {
      const tableLines: string[] = [trimmed]
      i++
      // Collect all consecutive table lines
      while (i < lines.length) {
        const nextTrimmed = lines[i].trim()
        if (nextTrimmed.startsWith('|') && nextTrimmed.endsWith('|')) {
          tableLines.push(nextTrimmed)
          i++
        } else {
          break
        }
      }
      // Parse table: first row = headers, skip separator, rest = data rows
      if (tableLines.length >= 2) {
        const headers = parseTableRow(tableLines[0])
        const rows: string[][] = []
        for (let t = 1; t < tableLines.length; t++) {
          if (!isTableSeparator(tableLines[t])) {
            rows.push(parseTableRow(tableLines[t]))
          }
        }
        parsed.push({ type: 'table', text: '', table: { headers, rows } })
      }
      continue
    }

    if (trimmed === '') {
      parsed.push({ type: 'blank', text: '' })
    } else if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      parsed.push({ type: 'hr', text: '' })
    } else if (trimmed.startsWith('#### ')) {
      parsed.push({ type: 'h4', text: trimmed.slice(5) })
    } else if (trimmed.startsWith('### ')) {
      parsed.push({ type: 'h3', text: trimmed.slice(4) })
    } else if (trimmed.startsWith('## ')) {
      parsed.push({ type: 'h2', text: trimmed.slice(3) })
    } else if (trimmed.startsWith('# ')) {
      parsed.push({ type: 'h1', text: trimmed.slice(2) })
    } else if (/^>\s?/.test(trimmed)) {
      parsed.push({ type: 'blockquote', text: trimmed.replace(/^>\s?/, '') })
    } else if (/^[-*+]\s/.test(trimmed)) {
      const indent = line.search(/\S/)
      parsed.push({ type: 'bullet', text: trimmed.slice(2), indent: Math.floor(indent / 2) })
    } else if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^\d+\.\s(.*)/)
      parsed.push({ type: 'numbered', text: match ? match[1] : trimmed, indent: 0 })
    } else if (/^\*\*[^*]+\*\*$/.test(trimmed)) {
      parsed.push({ type: 'bold-line', text: trimmed.replace(/\*\*/g, '') })
    } else {
      parsed.push({ type: 'paragraph', text: trimmed })
    }
    i++
  }

  // Strip trailing blank lines to avoid unnecessary empty pages
  while (parsed.length > 0 && parsed[parsed.length - 1].type === 'blank') {
    parsed.pop()
  }

  return parsed
}

// Register fonts with fallback
function registerFonts(doc: PDFKit.PDFDocument): boolean {
  let fontsLoaded = false
  try {
    const sohneKraftig = resolveAsset('fonts/SohneBreit-Kraftig.ttf')
    const interRegular = resolveAsset('fonts/Inter-Regular.ttf')

    if (fs.existsSync(sohneKraftig)) {
      doc.registerFont('SohneBreit-Kraftig', sohneKraftig)
    }
    if (fs.existsSync(interRegular)) {
      doc.registerFont('Inter', interRegular)
    }
    fontsLoaded = true
  } catch (err) {
    console.warn('Could not load custom fonts, using Helvetica fallback:', err)
  }
  return fontsLoaded
}

// Font helpers with fallback
// Ecommpay brand: Söhne Breit Kräftig for headings, Inter for body
function fontHeading(fontsLoaded: boolean): string {
  return fontsLoaded ? 'SohneBreit-Kraftig' : 'Helvetica-Bold'
}
function fontSubheading(fontsLoaded: boolean): string {
  return fontsLoaded ? 'SohneBreit-Kraftig' : 'Helvetica-Bold'
}
function fontBody(fontsLoaded: boolean): string {
  return fontsLoaded ? 'Inter' : 'Helvetica'
}

// Draw gradient accent bar (Ecommpay Purple → New World Purple)
function drawGradientBar(doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number) {
  const grad = doc.linearGradient(x, y, x + width, y)
  grad.stop(0, COLORS.ecommpayPurple)
  grad.stop(1, COLORS.newWorldPurple)
  doc.rect(x, y, width, height).fill(grad)
}

// Draw page header with logos
// Ecommpay is the primary brand (left); Savi is shown as a sub-brand (right, smaller)
function drawPageHeader(doc: PDFKit.PDFDocument) {
  const ecommpayLogoPath = resolvePublicAsset('img/ecommpay_white.png')
  const saviLogoPath = resolvePublicAsset('img/Savi_logo_Savi_White out copy.png')

  // Ecommpay Purple header background
  doc.rect(0, 0, PAGE.width, 55).fill(COLORS.ecommpayPurple)

  // Ecommpay logo — primary brand, left
  try {
    if (fs.existsSync(ecommpayLogoPath)) {
      doc.image(ecommpayLogoPath, PAGE.marginLeft, 12, { height: 30 })
    }
  } catch (err) {
    console.warn('Could not load ecommpay logo:', err)
  }

  // Savi logo — sub-brand, right and slightly smaller
  try {
    if (fs.existsSync(saviLogoPath)) {
      doc.image(saviLogoPath, PAGE.width - PAGE.marginRight - 70, 17, { height: 22 })
    }
  } catch (err) {
    console.warn('Could not load Savi logo:', err)
  }

  // Purple gradient accent line below header
  drawGradientBar(doc, 0, 55, PAGE.width, 3)
}

// Draw page footer
// IMPORTANT: lineBreak: false prevents PDFKit from auto-creating blank pages
// when drawing text below the bottom margin boundary in buffered page mode
function drawPageFooter(doc: PDFKit.PDFDocument, pageNum: number, fontsLoaded: boolean) {
  const y = PAGE.height - 45

  // Thin gradient line
  drawGradientBar(doc, PAGE.marginLeft, y, PAGE.contentWidth, 1)

  // Footer text - lineBreak: false is critical to prevent blank page creation
  doc.font(fontBody(fontsLoaded)).fontSize(8).fillColor(COLORS.mediumGray)
  doc.text('Powered by Savi × ecommpay', PAGE.marginLeft, y + 8, {
    width: PAGE.contentWidth / 2,
    lineBreak: false,
  })
  doc.text(`Page ${pageNum}`, PAGE.width / 2, y + 8, {
    width: PAGE.contentWidth / 2,
    align: 'right',
    lineBreak: false,
  })
}


// Strip markdown inline formatting for clean text
function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')  // bold+italic
    .replace(/\*\*(.*?)\*\*/g, '$1')       // bold
    .replace(/\*(.*?)\*/g, '$1')           // italic
    .replace(/`(.*?)`/g, '$1')             // inline code
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')    // links
}

// Write rich text with inline bold/italic support
function writeRichText(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  width: number,
  fontsLoaded: boolean,
  fontSize: number = 10.5,
  color: string = COLORS.darkGray
) {
  // Simple approach: render with basic inline formatting
  const cleanText = stripInlineMarkdown(text)
  doc.font(fontBody(fontsLoaded)).fontSize(fontSize).fillColor(color)
  doc.text(cleanText, x, undefined, { width, lineGap: 3 })
}

// Check if we need a new page
function needsNewPage(doc: PDFKit.PDFDocument, spaceNeeded: number): boolean {
  return doc.y + spaceNeeded > PAGE.height - PAGE.marginBottom
}

// Draw a markdown table
function drawTable(
  doc: PDFKit.PDFDocument,
  table: TableData,
  fontsLoaded: boolean
) {
  const colCount = table.headers.length
  if (colCount === 0) return

  const tableWidth = PAGE.contentWidth
  const colWidth = tableWidth / colCount
  const cellPadding = 6
  const fontSize = 9
  const rowHeight = 22
  const headerBg = COLORS.ecommpayPurple
  const headerText = COLORS.white
  const altRowBg = COLORS.beige
  const borderColor = '#E0E0E0'
  const startX = PAGE.marginLeft

  // Estimate total table height to check for page break
  const totalHeight = rowHeight + (table.rows.length * rowHeight)
  if (needsNewPage(doc, Math.min(totalHeight, rowHeight * 4))) {
    doc.addPage()
    drawPageHeader(doc)
    doc.y = PAGE.marginTop + 10
  }

  let currentY = doc.y

  // Draw header row
  doc.rect(startX, currentY, tableWidth, rowHeight).fill(headerBg)
  doc.font(fontSubheading(fontsLoaded)).fontSize(fontSize).fillColor(headerText)
  for (let c = 0; c < colCount; c++) {
    const cellX = startX + (c * colWidth)
    doc.text(
      stripInlineMarkdown(table.headers[c] || ''),
      cellX + cellPadding,
      currentY + 6,
      { width: colWidth - (cellPadding * 2), lineBreak: false }
    )
  }
  currentY += rowHeight

  // Draw data rows
  doc.font(fontBody(fontsLoaded)).fontSize(fontSize).fillColor(COLORS.darkGray)
  for (let r = 0; r < table.rows.length; r++) {
    // Check for page break before each row
    if (currentY + rowHeight > PAGE.height - PAGE.marginBottom) {
      doc.addPage()
      drawPageHeader(doc)
      currentY = PAGE.marginTop + 10
    }

    // Alternating row background
    if (r % 2 === 0) {
      doc.rect(startX, currentY, tableWidth, rowHeight).fill(altRowBg)
    }

    // Row border
    doc.moveTo(startX, currentY + rowHeight)
      .lineTo(startX + tableWidth, currentY + rowHeight)
      .strokeColor(borderColor).lineWidth(0.5).stroke()

    // Cell text
    doc.fillColor(COLORS.darkGray)
    const row = table.rows[r]
    for (let c = 0; c < colCount; c++) {
      const cellX = startX + (c * colWidth)
      // Vertical cell border
      if (c > 0) {
        doc.moveTo(cellX, currentY)
          .lineTo(cellX, currentY + rowHeight)
          .strokeColor(borderColor).lineWidth(0.5).stroke()
      }
      doc.font(fontBody(fontsLoaded)).fontSize(fontSize).fillColor(COLORS.darkGray)
      doc.text(
        stripInlineMarkdown(row[c] || ''),
        cellX + cellPadding,
        currentY + 6,
        { width: colWidth - (cellPadding * 2), lineBreak: false }
      )
    }
    currentY += rowHeight
  }

  // Outer border
  doc.rect(startX, doc.y, tableWidth, currentY - doc.y)
    .strokeColor(borderColor).lineWidth(1).stroke()

  doc.y = currentY + 5
}

// Main PDF generation function
export async function generatePdf(outputPath: string, options: PdfOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: PAGE.marginTop,
          bottom: PAGE.marginBottom,
          left: PAGE.marginLeft,
          right: PAGE.marginRight,
        },
        info: {
          Title: options.title,
          Author: 'Savi × ecommpay Knowledge Pipeline',
          Creator: 'Savi Knowledge Pipeline',
        },
        bufferPages: true,
      })

      const stream = fs.createWriteStream(outputPath)
      doc.pipe(stream)

      const fontsLoaded = registerFonts(doc)

      const lines = parseMarkdownLines(options.markdown)

      // Collect TOC entries during rendering
      const tocEntries: TocEntry[] = []

      // === COVER / TITLE SECTION ===
      drawPageHeader(doc)

      // Subtitle label — positioned above the title
      const subtitleY = 200
      doc.font(fontSubheading(fontsLoaded)).fontSize(11).fillColor(COLORS.highEndOrange)
      doc.text('KNOWLEDGE BASE ARTICLE', PAGE.marginLeft, subtitleY, {
        width: PAGE.contentWidth,
        characterSpacing: 2,
      })

      // Title — large, positioned in the upper-third of the page
      doc.moveDown(0.6)
      doc.font(fontHeading(fontsLoaded)).fontSize(38).fillColor(COLORS.ecommpayPurple)
      doc.text(options.title, PAGE.marginLeft, undefined, { width: PAGE.contentWidth })

      // Wide gradient bar under title
      doc.moveDown(0.5)
      drawGradientBar(doc, PAGE.marginLeft, doc.y, 160, 4)

      // Metadata block — positioned in the lower portion of the page
      const metaY = 560

      // Thin separator above metadata
      doc.moveTo(PAGE.marginLeft, metaY)
        .lineTo(PAGE.marginLeft + PAGE.contentWidth, metaY)
        .strokeColor('#D0D0D0').lineWidth(0.5).stroke()

      if (options.category) {
        doc.font(fontSubheading(fontsLoaded)).fontSize(10).fillColor(COLORS.mediumGray)
        doc.text('Category', PAGE.marginLeft, metaY + 16, { width: PAGE.contentWidth })
        doc.font(fontHeading(fontsLoaded)).fontSize(14).fillColor(COLORS.ecommpayPurple)
        doc.text(options.category, PAGE.marginLeft, undefined, { width: PAGE.contentWidth })
      }

      if (options.approvedAt) {
        const dateStr = new Date(options.approvedAt).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'long', year: 'numeric'
        })
        const dateY = options.category ? metaY + 60 : metaY + 16
        doc.font(fontSubheading(fontsLoaded)).fontSize(10).fillColor(COLORS.mediumGray)
        doc.text('Approved', PAGE.marginLeft, dateY, { width: PAGE.contentWidth })
        doc.font(fontHeading(fontsLoaded)).fontSize(14).fillColor(COLORS.ecommpayPurple)
        doc.text(dateStr, PAGE.marginLeft, undefined, { width: PAGE.contentWidth })
      }

      // Decorative gradient band near the bottom of the cover page
      const bandY = PAGE.height - 100
      drawGradientBar(doc, 0, bandY, PAGE.width, 6)

      // === TABLE OF CONTENTS PAGE ===
      // Add a blank TOC page now; we'll fill it in after content is rendered
      // so we know the actual page numbers.
      doc.addPage()
      drawPageHeader(doc)
      const tocPageIndex = doc.bufferedPageRange().count - 1

      // === BODY CONTENT ===
      // Start body on a NEW page so the TOC page stays blank for later rendering.
      doc.addPage()
      drawPageHeader(doc)
      doc.y = PAGE.marginTop + 10
      let lastType: string = ''

      for (const line of lines) {
        // Check for page break needs
        if (line.type === 'h2' && needsNewPage(doc, 60)) {
          doc.addPage()
          drawPageHeader(doc)
          doc.y = PAGE.marginTop + 10
        } else if (needsNewPage(doc, 25)) {
          doc.addPage()
          drawPageHeader(doc)
          doc.y = PAGE.marginTop + 10
        }

        switch (line.type) {
          case 'h1':
            doc.moveDown(0.5)
            doc.font(fontHeading(fontsLoaded)).fontSize(22).fillColor(COLORS.ecommpayPurple)
            doc.text(stripInlineMarkdown(line.text), PAGE.marginLeft, undefined, { width: PAGE.contentWidth })
            drawGradientBar(doc, PAGE.marginLeft, doc.y + 2, 60, 2)
            doc.moveDown(0.6)
            break

          case 'h2':
            tocEntries.push({ text: stripInlineMarkdown(line.text), level: 2, page: doc.bufferedPageRange().count })
            if (lastType !== 'blank') doc.moveDown(0.8)
            doc.font(fontHeading(fontsLoaded)).fontSize(17).fillColor(COLORS.ecommpayPurple)
            doc.text(stripInlineMarkdown(line.text), PAGE.marginLeft, undefined, { width: PAGE.contentWidth })
            drawGradientBar(doc, PAGE.marginLeft, doc.y + 2, 50, 2)
            doc.moveDown(0.5)
            break

          case 'h3':
            if (lastType !== 'blank') doc.moveDown(0.5)
            doc.font(fontSubheading(fontsLoaded)).fontSize(13.5).fillColor(COLORS.ecommpayPurple)
            doc.text(stripInlineMarkdown(line.text), PAGE.marginLeft, undefined, { width: PAGE.contentWidth })
            doc.moveDown(0.3)
            break

          case 'h4':
            if (lastType !== 'blank') doc.moveDown(0.3)
            doc.font(fontSubheading(fontsLoaded)).fontSize(11.5).fillColor(COLORS.ecommpayLilac)
            doc.text(stripInlineMarkdown(line.text), PAGE.marginLeft, undefined, { width: PAGE.contentWidth })
            doc.moveDown(0.2)
            break

          case 'paragraph':
            writeRichText(doc, line.text, PAGE.marginLeft, PAGE.contentWidth, fontsLoaded)
            doc.moveDown(0.4)
            break

          case 'bold-line':
            doc.font(fontSubheading(fontsLoaded)).fontSize(10.5).fillColor(COLORS.darkGray)
            doc.text(line.text, PAGE.marginLeft, undefined, { width: PAGE.contentWidth })
            doc.moveDown(0.3)
            break

          case 'bullet': {
            const indent = (line.indent || 0) * 15
            const bulletX = PAGE.marginLeft + 10 + indent
            const textX = bulletX + 12
            const textWidth = PAGE.contentWidth - 22 - indent

            // Draw bullet dot
            doc.circle(bulletX + 2, doc.y + 5, 2).fill(COLORS.newWorldPurple)
            writeRichText(doc, line.text, textX, textWidth, fontsLoaded)
            doc.moveDown(0.15)
            break
          }

          case 'numbered': {
            const numX = PAGE.marginLeft + 10
            const numWidth = PAGE.contentWidth - 28

            doc.font(fontBody(fontsLoaded)).fontSize(10.5).fillColor(COLORS.darkGray)
            doc.text(`• ${stripInlineMarkdown(line.text)}`, numX, undefined, { width: numWidth, lineGap: 3 })
            doc.moveDown(0.15)
            break
          }

          case 'hr':
            doc.moveDown(0.5)
            const hrY = doc.y
            drawGradientBar(doc, PAGE.marginLeft, hrY, PAGE.contentWidth, 1)
            doc.moveDown(0.8)
            break

          case 'code':
            doc.font('Courier').fontSize(9).fillColor(COLORS.darkGray)
            doc.rect(PAGE.marginLeft, doc.y - 2, PAGE.contentWidth, 14).fill('#F5F5F0')
            doc.fillColor(COLORS.darkGray)
            doc.text(line.text, PAGE.marginLeft + 8, undefined, { width: PAGE.contentWidth - 16 })
            break

          case 'table':
            if (line.table) {
              doc.moveDown(0.3)
              drawTable(doc, line.table, fontsLoaded)
              doc.moveDown(0.3)
            }
            break

          case 'blockquote': {
            const bqX = PAGE.marginLeft + 4
            const bqTextX = PAGE.marginLeft + 16
            const bqWidth = PAGE.contentWidth - 20
            // Draw left accent bar
            doc.rect(bqX, doc.y - 1, 3, 14).fill(COLORS.highEndOrange)
            // Draw blockquote text in italic style
            doc.font(fontBody(fontsLoaded)).fontSize(10.5).fillColor(COLORS.mediumGray)
            doc.text(stripInlineMarkdown(line.text), bqTextX, undefined, { width: bqWidth, lineGap: 3 })
            doc.moveDown(0.3)
            break
          }

          case 'blank':
            if (lastType !== 'blank') doc.moveDown(0.3)
            break
        }

        lastType = line.type
      }

      // === RENDER TABLE OF CONTENTS ===
      // Now that all content is rendered, we know the page numbers.
      // Switch back to the TOC page and draw the entries.
      // Disable bottom margin to prevent auto-pagination (same trick as footers).
      doc.switchToPage(tocPageIndex)
      const savedTocY = doc.y
      const savedTocMargin = (doc.page as any).margins.bottom
      ;(doc.page as any).margins.bottom = 0
      doc.y = PAGE.marginTop + 10

      // TOC title
      doc.font(fontHeading(fontsLoaded)).fontSize(20).fillColor(COLORS.ecommpayPurple)
      doc.text('Table of Contents', PAGE.marginLeft, doc.y, { width: PAGE.contentWidth })
      drawGradientBar(doc, PAGE.marginLeft, doc.y + 2, 60, 2)
      doc.moveDown(1)

      // TOC entries — H2 is the top level, H3 is indented beneath it
      for (const entry of tocEntries) {
        const isTopLevel = entry.level === 2
        const indent = isTopLevel ? 0 : 20
        const entryX = PAGE.marginLeft + indent
        const entryWidth = PAGE.contentWidth - indent - 40
        const fontSize = isTopLevel ? 11 : 9.5
        const fontFn = isTopLevel ? fontSubheading : fontBody

        doc.font(fontFn(fontsLoaded)).fontSize(fontSize).fillColor(COLORS.darkGray)
        doc.text(entry.text, entryX, undefined, { width: entryWidth, continued: false })

        // Page number right-aligned on the same line
        const lineY = doc.y - (fontSize + 3) // go back up to the line we just wrote
        doc.font(fontBody(fontsLoaded)).fontSize(fontSize).fillColor(COLORS.mediumGray)
        doc.text(String(entry.page), PAGE.marginLeft, lineY, {
          width: PAGE.contentWidth,
          align: 'right',
          lineBreak: false,
        })

        doc.moveDown(isTopLevel ? 0.3 : 0.15)
      }

      ;(doc.page as any).margins.bottom = savedTocMargin
      doc.y = savedTocY

      // === ADD FOOTERS TO ALL PAGES ===
      // IMPORTANT: Temporarily disable bottom margin on each page during footer
      // rendering. Without this, doc.text() at the footer y-position (below the
      // normal bottom margin) triggers PDFKit's auto-pagination, creating a blank
      // page for every real page in the document.
      const range = doc.bufferedPageRange()
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i)
        const savedY = doc.y
        const savedMargin = (doc.page as any).margins.bottom
        ;(doc.page as any).margins.bottom = 0
        drawPageFooter(doc, i + 1, fontsLoaded)
        ;(doc.page as any).margins.bottom = savedMargin
        doc.y = savedY
      }

      // Switch back to the last page before ending to prevent
      // PDFKit from appending extra blank pages
      if (range.count > 0) {
        doc.switchToPage(range.count - 1)
      }

      // Flush all buffered pages and finalize
      doc.flushPages()
      doc.end()

      stream.on('finish', () => resolve())
      stream.on('error', (err) => reject(err))
    } catch (err) {
      reject(err)
    }
  })
}