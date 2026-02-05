// API service for topics

const API_BASE = '/api'

export interface Topic {
  id: string
  topic: string
  category: string | null
  priority: 'low' | 'medium' | 'high'
  status: 'Queued' | 'In Progress' | 'In Review' | 'Approved' | 'Rejected'
  approved_content: string | null
  md_file_path: string | null
  pdf_file_path: string | null
  customgpt_source_id: string | null
  customgpt_added_at: string | null
  created_at: string
  updated_at: string
  approved_at: string | null
}

export interface CreateTopicData {
  topic: string
  category?: string
  priority?: 'low' | 'medium' | 'high'
}

// Fetch all topics
export async function fetchTopics(): Promise<Topic[]> {
  const response = await fetch(`${API_BASE}/topics`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch topics')
  }
  
  return response.json()
}

// Fetch single topic by ID
export async function fetchTopic(id: string): Promise<Topic> {
  const response = await fetch(`${API_BASE}/topics/${id}`)
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Topic not found')
    }
    throw new Error('Failed to fetch topic')
  }
  
  return response.json()
}

// Create new topic
export async function createTopic(data: CreateTopicData): Promise<Topic> {
  const response = await fetch(`${API_BASE}/topics`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create topic' }))
    throw new Error(error.error || 'Failed to create topic')
  }
  
  return response.json()
}

// Add approved content to customGPT knowledge base
export async function addToCustomGPT(topicId: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/topics/${topicId}/add-to-customgpt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to add to customGPT' }))
    throw new Error(error.error || 'Failed to add to customGPT')
  }
  
  return response.json()
}

