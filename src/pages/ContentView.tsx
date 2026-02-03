import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchTopic, Topic } from '../api/topics'
import styles from './ContentView.module.css'

function ContentView() {
  const { id } = useParams<{ id: string }>()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (id) {
      loadTopic(id)
    }
  }, [id])

  async function loadTopic(topicId: string) {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchTopic(topicId)
      setTopic(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!topic?.approved_content) return
    try {
      await navigator.clipboard.writeText(topic.approved_content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleExport = () => {
    if (!topic?.approved_content) return
    const blob = new Blob([topic.approved_content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${topic.topic.toLowerCase().replace(/\s+/g, '-')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <Link to="/" className={styles.backLink}>← Back to Dashboard</Link>
        <div className={styles.loading}>Loading content...</div>
      </div>
    )
  }

  if (error || !topic) {
    return (
      <div className={styles.container}>
        <Link to="/" className={styles.backLink}>← Back to Dashboard</Link>
        <div className={styles.error}>{error || 'Content not found'}</div>
      </div>
    )
  }

  if (topic.status !== 'Approved' || !topic.approved_content) {
    return (
      <div className={styles.container}>
        <Link to="/" className={styles.backLink}>← Back to Dashboard</Link>
        <div className={styles.error}>This content is not yet approved</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backLink}>
        ← Back to Dashboard
      </Link>

      <div className={styles.header}>
        <div className={styles.meta}>
          <h1 className={styles.title}>{topic.topic}</h1>
          <p className={styles.approvedDate}>
            Approved on {formatDate(topic.approved_at)}
          </p>
        </div>

        <div className={styles.actions}>
          <button onClick={handleCopy} className={styles.actionButton}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <button onClick={handleExport} className={styles.actionButton}>
            Export
          </button>
        </div>
      </div>

      {/* Download buttons for n8n-generated files */}
      {(topic.md_file_path || topic.pdf_file_path) && (
        <div className={styles.downloadSection}>
          <h3 className={styles.downloadTitle}>Final Output Files</h3>
          <div className={styles.downloadButtons}>
            {topic.md_file_path && (
              <a
                href={`/api/topics/${topic.id}/files/content.md`}
                download
                className={styles.downloadButton}
              >
                📄 Download MD
              </a>
            )}
            {topic.pdf_file_path && (
              <a
                href={`/api/topics/${topic.id}/files/content.pdf`}
                download
                className={styles.downloadButton}
              >
                📕 Download PDF
              </a>
            )}
          </div>
        </div>
      )}

      <div className={styles.contentCard}>
        <pre className={styles.content}>{topic.approved_content}</pre>
      </div>
    </div>
  )
}

export default ContentView

