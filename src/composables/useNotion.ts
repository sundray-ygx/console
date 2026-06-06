import { ref } from 'vue'
import { API_BASE } from '../config/services'

export function useNotion() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchJson<T>(url: string): Promise<T | null> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}${url}`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      return await res.json()
    } catch (e: any) {
      error.value = e.message
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchDashboard() { return fetchJson<any>('/api/notion/dashboard') }
  async function fetchToday(date?: string) {
    const param = date ? `?date=${date}` : ''
    return fetchJson<any>(`/api/notion/today${param}`)
  }
  async function fetchOkr(status?: string) {
    const param = status ? `?status=${encodeURIComponent(status)}` : ''
    return fetchJson<any>(`/api/notion/okr${param}`)
  }
  async function fetchWeek() { return fetchJson<any>('/api/notion/week') }
  async function fetchKnowledge(tab?: string, page?: number, size?: number) {
    const params = new URLSearchParams()
    if (tab) params.set('tab', tab)
    if (page) params.set('page', String(page))
    if (size) params.set('size', String(size))
    const qs = params.toString()
    return fetchJson<any>(`/api/notion/knowledge${qs ? '?' + qs : ''}`)
  }
  async function fetchPdcaTimeline() { return fetchJson<any>('/api/notion/pdca/timeline') }
  async function fetchPdcaCurrent() { return fetchJson<any>('/api/notion/pdca/current') }

  return { loading, error, fetchDashboard, fetchToday, fetchOkr, fetchWeek, fetchKnowledge, fetchPdcaTimeline, fetchPdcaCurrent }
}
