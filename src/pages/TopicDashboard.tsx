import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchTopics, deleteTopic, Topic } from '../api/topics'
import styles from './TopicDashboard.module.css'

type TopicStatus = 'Queued' | 'In Progress' | 'In Review' | 'Approved' | 'Rejected'

function getStatusClass(status: TopicStatus): string {
  const statusMap: Record<TopicStatus, string> = {
    'Queued': styles.statusQueued,
    'In Progress': styles.statusInProgress,
    'In Review': styles.statusInReview,
    'Approved': styles.statusApproved,
    'Rejected': styles.statusRejected,
  }
  return statusMap[status] || ''
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function TopicDashboard() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadTopics()

    // Auto-refresh every 15 seconds so statuses stay current
    const interval = setInterval(() => {
      loadTopics(false)
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  async function loadTopics(showLoading = true) {
    try {
      if (showLoading) setLoading(true)
      setError(null)
      const data = await fetchTopics()
      setTopics(data)
    } catch (err) {
      // Only show error on initial load, not background refreshes
      if (showLoading) {
        setError(err instanceof Error ? err.message : 'Failed to load topics')
      }
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeleting(true)
      await deleteTopic(id)
      setTopics(prev => prev.filter(t => t.id !== id))
      setConfirmDeleteId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete topic')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Topic Dashboard</h1>
        <p className={styles.subtitle}>Track the status of your submitted topics</p>
      </div>

      {loading && <div className={styles.loading}>Loading topics...</div>}

      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && topics.length === 0 && (
        <div className={styles.empty}>
          <p>No topics yet.</p>
          <Link to="/submit" className={styles.submitLink}>Submit your first topic</Link>
        </div>
      )}

      {!loading && !error && topics.length > 0 && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Topic</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((topic) => (
                <tr key={topic.id}>
                  <td className={styles.topicName}>{topic.topic}</td>
                  <td>
                    <span className={`${styles.status} ${getStatusClass(topic.status as TopicStatus)}`}>
                      {topic.status}
                    </span>
                  </td>
                  <td className={styles.date}>{formatDate(topic.updated_at)}</td>
                  <td className={styles.actions}>
                    {topic.status === 'Approved' && (
                      <Link to={`/content/${topic.id}`} className={styles.viewLink}>
                        View Content
                      </Link>
                    )}
                    {confirmDeleteId === topic.id ? (
                      <span className={styles.confirmDelete}>
                        <span className={styles.confirmText}>Delete?</span>
                        <button
                          className={styles.confirmYes}
                          onClick={() => handleDelete(topic.id)}
                          disabled={deleting}
                        >
                          {deleting ? '...' : 'Yes'}
                        </button>
                        <button
                          className={styles.confirmNo}
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={deleting}
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <button
                        className={styles.deleteButton}
                        onClick={() => setConfirmDeleteId(topic.id)}
                        title="Delete topic"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default TopicDashboard

