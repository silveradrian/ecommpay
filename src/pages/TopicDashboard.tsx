import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchTopics, Topic } from '../api/topics'
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

  useEffect(() => {
    loadTopics()
  }, [])

  async function loadTopics() {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchTopics()
      setTopics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load topics')
    } finally {
      setLoading(false)
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
                  <td>
                    {topic.status === 'Approved' && (
                      <Link to={`/content/${topic.id}`} className={styles.viewLink}>
                        View Content
                      </Link>
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

