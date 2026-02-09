import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTopic } from '../api/topics'
import styles from './TopicIntake.module.css'

interface TopicFormData {
  topic: string
  category: string
}

function TopicIntake() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<TopicFormData>({
    topic: '',
    category: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.topic.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      await createTopic({
        topic: formData.topic.trim(),
        category: formData.category.trim() || undefined,
      })

      // Navigate to dashboard after successful submission
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit topic')
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Submit a Topic</h1>
        <p className={styles.subtitle}>
          Enter a knowledge gap you'd like content created for
        </p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="topic" className={styles.label}>
            Topic <span className={styles.required}>*</span>
          </label>
          <input
            id="topic"
            type="text"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            placeholder="e.g., Cross-border payment regulations"
            className={styles.input}
            required
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="category" className={styles.label}>
            Category <span className={styles.optional}>(optional)</span>
          </label>
          <input
            id="category"
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g., Compliance, Technical, Marketing"
            className={styles.input}
          />
        </div>

        <button
          type="submit" 
          className={styles.submitButton}
          disabled={isSubmitting || !formData.topic.trim()}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Topic'}
        </button>
      </form>
    </div>
  )
}

export default TopicIntake

