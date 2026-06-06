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

  async function uploadFile(file: File, targetDir: string) {
    const form = new FormData()
    form.append('file', file)
    form.append('targetDir', targetDir)
    const res = await fetch(`${API_BASE}/api/fs/upload`, { method: 'POST', body: form })
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
    return res.json()
  }

  async function createDir(path: string) {
    const res = await fetch(`${API_BASE}/api/fs/mkdir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    })
    if (!res.ok) throw new Error(`Mkdir failed: ${res.status}`)
    return res.json()
  }

  async function renamePath(oldPath: string, newPath: string) {
    const res = await fetch(`${API_BASE}/api/fs/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPath, newPath }),
    })
    if (!res.ok) throw new Error(`Rename failed: ${res.status}`)
    return res.json()
  }

  async function deletePath(path: string) {
    const res = await fetch(`${API_BASE}/api/fs/file?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
    return res.json()
  }

  return { tree, file, loading, error, fetchTree, fetchFile, uploadFile, createDir, renamePath, deletePath }
}
