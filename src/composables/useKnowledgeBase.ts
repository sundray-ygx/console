import { ref } from 'vue'
import { API_BASE } from '../config/services'

export function useKnowledgeBase() {
  const tree = ref<any[]>([])
  const file = ref<any>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTree() {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/api/fs/tree`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      tree.value = data.tree
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchFile(path: string) {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/api/fs/file?path=${encodeURIComponent(path)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      file.value = await res.json()
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return { tree, file, loading, error, fetchTree, fetchFile }
}
