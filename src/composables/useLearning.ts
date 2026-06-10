import { ref } from 'vue'
import { API_BASE } from '../config/services'

/* ── Types ── */

export interface Progress {
  id?: number
  area_id: string
  course_id: string
  progress: number
  last_read?: string
  total_time?: number
}

export interface Note {
  id?: number
  area_id: string
  course_id: string
  chapter_id?: string
  lesson_id?: string
  note_type: 'general' | 'chapter' | 'reflection'
  content: string
  created_at?: string
  updated_at?: string
}

export interface Highlight {
  id?: number
  area_id: string
  course_id: string
  chapter_id?: string
  lesson_id?: string
  content: string
  position?: string
  color?: string
  note?: string
  created_at?: string
}

/* ── State ── */

const loading = ref(false)
const error = ref<string | null>(null)

/* ── Composable ── */

export function useLearning() {
  // Progress management
  async function fetchProgress(courseId: string, chapterId?: string, lessonId?: string): Promise<Progress | null> {
    loading.value = true
    error.value = null
    try {
      let url = `${API_BASE}/api/learning/progress/${courseId}`
      const params = new URLSearchParams()
      if (chapterId) params.append('chapter_id', chapterId)
      if (lessonId) params.append('lesson_id', lessonId)
      if (params.toString()) url += `?${params}`

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch progress')
      return await res.json()
    } catch (e: any) {
      error.value = e.message
      return null
    } finally {
      loading.value = false
    }
  }

  async function saveProgress(progressData: Partial<Progress>): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/api/learning/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressData),
      })
      return res.ok
    } catch (e: any) {
      error.value = e.message
      return false
    } finally {
      loading.value = false
    }
  }

  // Notes management
  async function fetchNotes(courseId: string, chapterId?: string, lessonId?: string): Promise<Note[]> {
    loading.value = true
    error.value = null
    try {
      let url = `${API_BASE}/api/learning/notes/${courseId}`
      const params = new URLSearchParams()
      if (chapterId) params.append('chapter_id', chapterId)
      if (lessonId) params.append('lesson_id', lessonId)
      if (params.toString()) url += `?${params}`

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch notes')
      const data = await res.json()
      return data.notes || []
    } catch (e: any) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }

  async function createNote(note: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<number | null> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/api/learning/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      })
      if (!res.ok) throw new Error('Failed to create note')
      const data = await res.json()
      return data.id
    } catch (e: any) {
      error.value = e.message
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateNote(id: number, content: string): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/api/learning/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      return res.ok
    } catch (e: any) {
      error.value = e.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteNote(id: number): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/api/learning/notes/${id}`, {
        method: 'DELETE',
      })
      return res.ok
    } catch (e: any) {
      error.value = e.message
      return false
    } finally {
      loading.value = false
    }
  }

  // Highlights management
  async function fetchHighlights(courseId: string, chapterId?: string, lessonId?: string): Promise<Highlight[]> {
    loading.value = true
    error.value = null
    try {
      let url = `${API_BASE}/api/learning/highlights/${courseId}`
      const params = new URLSearchParams()
      if (chapterId) params.append('chapter_id', chapterId)
      if (lessonId) params.append('lesson_id', lessonId)
      if (params.toString()) url += `?${params}`

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch highlights')
      const data = await res.json()
      return data.highlights || []
    } catch (e: any) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }

  async function addHighlight(highlight: Omit<Highlight, 'id' | 'created_at'>): Promise<number | null> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/api/learning/highlights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(highlight),
      })
      if (!res.ok) throw new Error('Failed to add highlight')
      const data = await res.json()
      return data.id
    } catch (e: any) {
      error.value = e.message
      return null
    } finally {
      loading.value = false
    }
  }

  async function deleteHighlight(id: number): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/api/learning/highlights/${id}`, {
        method: 'DELETE',
      })
      return res.ok
    } catch (e: any) {
      error.value = e.message
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    // Progress
    fetchProgress,
    saveProgress,
    // Notes
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    // Highlights
    fetchHighlights,
    addHighlight,
    deleteHighlight,
  }
}
