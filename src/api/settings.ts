// API service for settings

const API_BASE = '/api'

export interface Setting {
  key: string
  value: string
  updated_at: string
}

// Fetch a setting by key
export async function fetchSetting(key: string): Promise<Setting> {
  const response = await fetch(`${API_BASE}/settings/${key}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Setting not found')
    }
    throw new Error('Failed to fetch setting')
  }

  return response.json()
}

// Update a setting
export async function updateSetting(key: string, value: string): Promise<Setting> {
  const response = await fetch(`${API_BASE}/settings/${key}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update setting' }))
    throw new Error(error.error || 'Failed to update setting')
  }

  return response.json()
}

