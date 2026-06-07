<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useKnowledgeBase } from '../composables/useKnowledgeBase'
import FileTree from '../components/FileTree.vue'
import MarkdownViewer from '../components/MarkdownViewer.vue'
import UploadDialog from '../components/UploadDialog.vue'
import { API_BASE } from '../config/services'

const { tree, file, loading, error, fetchTree, fetchFile, createDir, renamePath, deletePath } = useKnowledgeBase()

const selectedPath = ref<string>('')
const recentFiles = ref<{ name: string; path: string; mtime: string; size: number }[]>([])

const treeCollapsed = ref(localStorage.getItem('console-kb-tree-collapsed') === 'true')

function toggleTree() {
  treeCollapsed.value = !treeCollapsed.value
  localStorage.setItem('console-kb-tree-collapsed', String(treeCollapsed.value))
}

const showUpload = ref(false)
const creatingDir = ref(false)
const newDirName = ref('')

const allDirs = computed(() => {
  const dirs: { path: string; name: string }[] = []
  function walk(items: any[], prefix = '') {
    for (const item of items) {
      if (item.type === 'dir') {
        const displayPath = prefix ? `${prefix}/${item.name}` : item.name
        dirs.push({ path: item.path, name: displayPath })
        if (item.children) walk(item.children, displayPath)
      }
    }
  }
  walk(tree.value)
  return dirs
})

async function handleUploadDone() {
  showUpload.value = false
  await fetchTree()
}

function startCreateDir() {
  creatingDir.value = true
  newDirName.value = ''
}

async function confirmCreateDir() {
  if (!newDirName.value) return
  const parentDir = selectedPath.value ? selectedPath.value.split('/').slice(0, -1).join('/') : ''
  const path = parentDir ? `${parentDir}/${newDirName.value}` : newDirName.value
  await createDir(path)
  creatingDir.value = false
  await fetchTree()
}

async function handleRename(oldPath: string, newPath: string) {
  await renamePath(oldPath, newPath)
  await fetchTree()
}

async function handleDelete(path: string) {
  await deletePath(path)
  if (selectedPath.value === path) {
    selectedPath.value = ''
    file.value = null
  }
  await fetchTree()
}

function handleDownload(path: string) {
  window.open(`${API_BASE}/api/fs/download?path=${encodeURIComponent(path)}`, '_blank')
}

onMounted(async () => {
  const [_, recentRes] = await Promise.all([
    fetchTree(),
    fetch(`${API_BASE}/api/fs/recent?limit=10`).then(r => r.json()).catch(() => ({ files: [] })),
  ])
  if (recentRes.files) recentFiles.value = recentRes.files

  if (tree.value && tree.value.length > 0) {
    const firstFile = findFirstMdFile(tree.value)
    if (firstFile) {
      selectedPath.value = firstFile.path
      await fetchFile(firstFile.path)
    }
  }
})

function findFirstMdFile(items: any[]): any | null {
  for (const item of items) {
    if (item.type === 'file' && item.name.endsWith('.md')) return item
    if (item.type === 'dir' && item.children) {
      const found = findFirstMdFile(item.children)
      if (found) return found
    }
  }
  return null
}

async function handleSelect(path: string) {
  selectedPath.value = path
  await fetchFile(path)
}

async function selectRecent(path: string) {
  selectedPath.value = path
  await fetchFile(path)
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return `${diffMin}分钟前`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}小时前`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}天前`
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>

<template>
  <div class="kb">
    <h1 class="page-title">Wiki</h1>
    <p class="page-subtitle">Hermes 知识库文件 · 本地 Markdown 知识管理</p>

    <div v-if="loading && tree.length === 0" class="loading-state">
      <span class="loading-spinner">⟳</span>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{{ error }}</p>
    </div>

    <div v-else class="kb-layout" :class="{ 'tree-hidden': treeCollapsed }">
      <!-- Left: Recent + File Tree -->
      <div v-if="!treeCollapsed" class="tree-panel">
        <div class="tree-header">
          <span class="tree-title">📁 knowledge/</span>
          <div class="tree-toolbar">
            <button class="tb-btn" @click="showUpload = true" title="上传文件">⬆</button>
            <button class="tb-btn" @click="startCreateDir" title="新建文件夹">＋</button>
            <button class="tb-btn" @click="fetchTree()" title="刷新">⟳</button>
            <button class="tree-toggle" @click="toggleTree" title="收缩面板">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          </div>
        </div>
        <!-- Recent Files -->
        <div v-if="recentFiles.length > 0" class="recent-section">
          <div class="recent-header">最近编辑</div>
          <div
            v-for="f in recentFiles"
            :key="f.path"
            class="recent-item"
            :class="{ selected: selectedPath === f.path }"
            @click="selectRecent(f.path)"
          >
            <span class="recent-name">📄 {{ f.name.replace('.md', '') }}</span>
            <span class="recent-time">{{ fmtTime(f.mtime) }}</span>
          </div>
        </div>
        <div class="recent-divider"></div>
        <div v-if="creatingDir" class="mkdir-row">
          <input v-model="newDirName" class="mkdir-input" placeholder="文件夹名称"
            @keyup.enter="confirmCreateDir" @keyup.escape="creatingDir = false" />
          <button class="mkdir-ok" @click="confirmCreateDir">✓</button>
          <button class="mkdir-cancel" @click="creatingDir = false">✕</button>
        </div>
        <FileTree
          v-if="tree.length > 0"
          :items="tree"
          :selected-path="selectedPath"
          @select="handleSelect"
          @download="handleDownload"
          @rename="handleRename"
          @delete="handleDelete"
        />
        <div v-else class="tree-empty">
          <p>暂无文件</p>
        </div>
      </div>

      <!-- Right: Markdown Viewer -->
      <div class="md-panel">
        <div class="md-header">
          <button v-if="treeCollapsed" class="tree-expand-btn" @click="toggleTree" title="展开文件树">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            <span>文件树</span>
          </button>
          <span class="md-path">{{ selectedPath || '未选择文件' }}</span>
          <button v-if="selectedPath && !file?.isBinary" class="md-download" @click="handleDownload(selectedPath)" title="下载">⬇</button>
        </div>
        <div v-if="loading && !file" class="loading-state">
          <span class="loading-spinner">⟳</span>
          <p>加载中...</p>
        </div>
        <MarkdownViewer v-if="file && !file.isBinary" :html="file.content" />
        <div v-else-if="file?.isBinary" class="binary-info">
          <p class="binary-name">{{ file.name }}</p>
          <p class="binary-meta">{{ (file.size / 1024).toFixed(1) }} KB · {{ file.lastModified?.slice(0,10) }}</p>
          <button class="binary-download" @click="handleDownload(selectedPath)">下载文件</button>
        </div>
        <MarkdownViewer v-else :html="null" />
      </div>
    </div>
    <UploadDialog
      v-if="showUpload"
      :dirs="allDirs"
      :default-dir="selectedPath ? selectedPath.split('/').slice(0, -1).join('/') || 'inbox' : 'inbox'"
      @close="showUpload = false"
      @uploaded="handleUploadDone"
    />
  </div>
</template>

<style scoped>
.kb { padding-top: 32px; }
.page-title { font-size: 28px; font-weight: 510; letter-spacing: -0.6px; color: var(--text-primary); margin-bottom: 4px; }
.page-subtitle { font-size: 14px; color: var(--text-tertiary); margin-bottom: 24px; }

.loading-state, .error-state, .tree-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 40px 20px; color: var(--text-tertiary);
}
.loading-spinner { font-size: 28px; animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.error-icon { font-size: 28px; }
.tree-empty p { margin: 0; font-size: 13px; }

.kb-layout { display: grid; grid-template-columns: 280px 1fr; gap: 16px; height: calc(100vh - 200px); min-height: 400px; }
.kb-layout.tree-hidden { grid-template-columns: 1fr; }

.tree-panel {
  background: var(--bg-surface); border: 1px solid var(--border-subtle);
  border-radius: 12px; display: flex; flex-direction: column; overflow-y: auto;
}
.tree-header { padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); }
.tree-title { font-size: 12px; font-weight: 510; color: var(--text-tertiary); font-family: var(--font-mono); }

/* Recent */
.recent-section { padding: 8px 0 4px; }
.recent-header { font-size: 10px; font-weight: 510; color: var(--text-quaternary); text-transform: uppercase; padding: 4px 16px; letter-spacing: 0.05em; }
.recent-item {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 16px; cursor: pointer; transition: background 0.12s;
}
.recent-item:hover { background: var(--hover-bg); }
.recent-item.selected { background: var(--active-bg); }
.recent-name { font-size: 12px; color: var(--text-tertiary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.recent-time { font-size: 10px; font-family: var(--font-mono); color: var(--text-quaternary); flex-shrink: 0; }
.recent-divider { height: 1px; background: var(--border-subtle); margin: 4px 16px; }

/* Markdown */
.md-panel {
  background: var(--bg-surface); border: 1px solid var(--border-subtle);
  border-radius: 12px; display: flex; flex-direction: column; overflow: hidden;
}
.md-header { padding: 10px 16px; border-bottom: 1px solid var(--border-subtle); }
.md-path { font-size: 11px; font-family: var(--font-mono); color: var(--text-quaternary); }

.tree-toggle {
  background: none; border: none; color: var(--text-quaternary);
  cursor: pointer; padding: 2px; display: flex; align-items: center;
  transition: color 0.15s; margin-left: auto;
}
.tree-toggle:hover { color: var(--text-secondary); }
.tree-expand-btn {
  display: inline-flex; align-items: center; gap: 4px;
  background: none; border: 1px solid var(--border-subtle);
  border-radius: 4px; padding: 2px 8px; color: var(--text-quaternary);
  cursor: pointer; font-size: 11px; margin-right: 8px; transition: all 0.15s;
}
.tree-expand-btn:hover { background: var(--hover-bg); color: var(--text-secondary); }

@media (max-width: 768px) {
  .kb-layout { grid-template-columns: 1fr; height: auto; }
  .tree-panel { max-height: 300px; }
  .md-panel { min-height: 400px; }
}

.tree-toolbar { display: flex; gap: 2px; margin-left: auto; }
.tb-btn {
  background: none; border: none; color: var(--text-quaternary);
  cursor: pointer; padding: 2px 6px; font-size: 14px; border-radius: 4px;
  transition: all 0.12s;
}
.tb-btn:hover { background: var(--hover-bg); color: var(--text-secondary); }
.mkdir-row { display: flex; gap: 4px; padding: 6px 16px; align-items: center; }
.mkdir-input {
  flex: 1; background: var(--bg-canvas); border: 1px solid var(--accent);
  border-radius: 4px; padding: 4px 8px; font-size: 12px; color: var(--text-primary);
  font-family: var(--font-mono); outline: none;
}
.mkdir-ok, .mkdir-cancel {
  background: none; border: 1px solid var(--border-subtle); border-radius: 4px;
  color: var(--text-tertiary); cursor: pointer; padding: 4px 8px; font-size: 12px;
}
.mkdir-ok:hover { border-color: var(--accent); color: var(--accent); }
.md-download {
  background: none; border: none; color: var(--text-quaternary);
  cursor: pointer; font-size: 14px; padding: 2px; margin-left: auto;
}
.md-download:hover { color: var(--accent); }
.binary-info {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 8px; padding: 60px 20px; color: var(--text-tertiary);
}
.binary-name { font-size: 14px; font-weight: 510; }
.binary-meta { font-size: 12px; color: var(--text-quaternary); font-family: var(--font-mono); }
.binary-download {
  padding: 8px 20px; border-radius: 6px; border: none;
  background: var(--accent); color: #fff; cursor: pointer; font-size: 13px;
  margin-top: 8px;
}
</style>
