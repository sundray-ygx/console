import { ref } from 'vue'
import { API_BASE } from '../config/services'

export interface AreaChild {
  id: string
  name: string
  type: string
  count: number
}

export interface Area {
  id: string
  name: string
  icon: string
  source: string
  itemCount: number
  children: AreaChild[]
}

export interface AreasResponse {
  areas: Area[]
}

export function useAreas() {
  const areas = ref<Area[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAreas() {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/api/areas`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: AreasResponse = await res.json()
      areas.value = data.areas || []
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return { areas, loading, error, fetchAreas }
}
