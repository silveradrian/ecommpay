import { useState, useEffect } from 'react'
import { fetchSetting, updateSetting } from '../api/settings'
import styles from './Settings.module.css'

function Settings() {
  const [prompt, setPrompt] = useState('')
  const [savedPrompt, setSavedPrompt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadPrompt()
  }, [])

  async function loadPrompt() {
    try {
      setLoading(true)
      setError(null)
      const setting = await fetchSetting('perplexity_system_prompt')
      setPrompt(setting.value)
      setSavedPrompt(setting.value)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load setting')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)
      const setting = await updateSetting('perplexity_system_prompt', prompt)
      setSavedPrompt(setting.value)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save setting')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setPrompt(savedPrompt)
    setError(null)
    setSuccess(false)
  }

  const hasChanges = prompt !== savedPrompt

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Configure your content generation pipeline</p>
      </div>

      {loading && <div className={styles.loading}>Loading settings...</div>}

      {!loading && (
        <div className={styles.card}>
          <div className={styles.field}>
            <label htmlFor="systemPrompt" className={styles.label}>
              Perplexity System Prompt
            </label>
            <p className={styles.description}>
              This prompt is sent as the system message to Perplexity AI when generating content.
              It controls the tone, style, and approach of all generated documents.
            </p>
            <textarea
              id="systemPrompt"
              value={prompt}
              onChange={(e) => { setPrompt(e.target.value); setSuccess(false) }}
              className={styles.textarea}
              rows={8}
              placeholder="Enter the system prompt for Perplexity..."
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>Settings saved successfully</div>}

          <div className={styles.actions}>
            <button
              className={styles.saveButton}
              onClick={handleSave}
              disabled={saving || !hasChanges || !prompt.trim()}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {hasChanges && (
              <button
                className={styles.resetButton}
                onClick={handleReset}
                disabled={saving}
              >
                Discard Changes
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings

