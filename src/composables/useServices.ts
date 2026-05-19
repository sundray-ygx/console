import { ref, onMounted, onUnmounted } from 'vue'
import { API_BASE } from '../config/services'

export function useServices(intervalMs = 30000) {
  const healthMap = ref<Record<string, any>>({})
  const loading = ref(true)
  const error = ref<string | null>(null)

  async function refresh() {
    try {
      const res = await fetch(`${API_BASE}/api/health`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const map: Record<string, any> = {}
      data.forEach((s: any) => { map[s.id] = s })
      healthMap.value = map
      error.value = null
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  let timer: ReturnType<typeof setInterval> | null = null
  onMounted(() => { refresh(); timer = setInterval(refresh, intervalMs) })
  onUnmounted(() => { if (timer) clearInterval(timer) })

  return { healthMap, loading, error, refresh }
}
