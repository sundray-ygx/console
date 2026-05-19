import { ref, onMounted, onUnmounted } from 'vue'
import { API_BASE } from '../config/services'

export function useSystem(intervalMs = 10000) {
  const data = ref<any>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  async function refresh() {
    try {
      const res = await fetch(`${API_BASE}/api/system`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      data.value = await res.json()
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

  return { data, loading, error, refresh }
}
