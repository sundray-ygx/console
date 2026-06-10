import { ref } from 'vue'
import { API_BASE } from '../config/services'

/* ── Types ── */

export interface Book {
  id: number
  title: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  last_modified: number
  indexed_at: string
}

export interface BookGroup {
  topic: string
  books: Book[]
}

/* ── State ── */

const loading = ref(false)
const error = ref<string | null>(null)

/* ── Composable ── */

export function useBooks() {
  async function indexBooks() {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/api/books/index`, { method: 'POST' })
      if (!res.ok) throw new Error('Index failed')
      return await res.json()
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function searchBooks(keyword: string, limit = 20): Promise<Book[]> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/api/books/search?q=${encodeURIComponent(keyword)}&limit=${limit}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      return data.books || []
    } catch (e: any) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }

  async function getRecentBooks(limit = 10): Promise<Book[]> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/api/books/recent?limit=${limit}`)
      if (!res.ok) throw new Error('Failed to get recent books')
      const data = await res.json()
      return data.books || []
    } catch (e: any) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }

  async function getBookInfo(id: number): Promise<Book | null> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/api/books/${id}/info`)
      if (!res.ok) throw new Error('Failed to get book info')
      return await res.json()
    } catch (e: any) {
      error.value = e.message
      return null
    } finally {
      loading.value = false
    }
  }

  function getBookViewUrl(id: number): string {
    return `${API_BASE}/api/books/${id}/view`
  }

  async function getBooksByTopic(limit = 500): Promise<BookGroup[]> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/api/books/by-topic?limit=${limit}`)
      if (!res.ok) throw new Error('Failed to get books by topic')
      const data = await res.json()
      return data.groups || []
    } catch (e: any) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    indexBooks,
    searchBooks,
    getRecentBooks,
    getBookInfo,
    getBookViewUrl,
    getBooksByTopic,
  }
}
