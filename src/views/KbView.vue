<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useKnowledgeBase } from '../composables/useKnowledgeBase'
import FileTree from '../components/FileTree.vue'
import MarkdownViewer from '../components/MarkdownViewer.vue'

const { tree, file, loading, error, fetchTree, fetchFile } = useKnowledgeBase()

const selectedPath = ref<string>('')

onMounted(async () => {
  await fetchTree()
  // Select first markdown file by default
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
    if (item.type === 'file' && item.name.endsWith('.md')) {
      return item
    }
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
</script>

<template>
  <div class="kb">
    <h1 class="page-title">Hermes 知识库</h1>
    <p class="page-subtitle">本地知识文件浏览器</p>

    <div v-if="loading && tree.length === 0" class="loading-state">
      <span class="loading-spinner">⟳</span>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{{ error }}</p>
    </div>

    <div v-else class="kb-layout">
      <!-- Left: File Tree -->
      <div class="tree-panel">
        <div class="tree-header">
          <span class="tree-title">📁 knowledge/</span>
        </div>
        <FileTree
          v-if="tree.length > 0"
          :items="tree"
          :selected-path="selectedPath"
          @select="handleSelect"
        />
        <div v-else class="tree-empty">
          <p>暂无文件</p>
        </div>
      </div>

      <!-- Right: Markdown Viewer -->
      <div class="md-panel">
        <div class="md-header">
          <span class="md-path">{{ selectedPath || '未选择文件' }}</span>
        </div>
        <div v-if="loading && !file" class="loading-state">
          <span class="loading-spinner">⟳</span>
          <p>加载中...</p>
        </div>
        <MarkdownViewer v-else :html="file?.content" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.kb { padding-top: 32px; }
.page-title { font-size: 28px; font-weight: 510; letter-spacing: -0.6px; color: var(--text-primary); margin-bottom: 4px; }
.page-subtitle { font-size: 14px; color: var(--text-tertiary); margin-bottom: 24px; }

.loading-state, .error-state, .tree-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: var(--text-tertiary);
}
.loading-spinner {
  font-size: 28px;
  animation: spin 1s linear infinite;
}
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.error-icon { font-size: 28px; }
.tree-empty p { margin: 0; font-size: 13px; }

.kb-layout { display: grid; grid-template-columns: 260px 1fr; gap: 16px; height: calc(100vh - 200px); min-height: 400px; }

/* Tree */
.tree-panel { background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; }
.tree-header { padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); }
.tree-title { font-size: 12px; font-weight: 510; color: var(--text-tertiary); font-family: var(--font-mono); }

/* Markdown */
.md-panel { background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; }
.md-header { padding: 10px 16px; border-bottom: 1px solid var(--border-subtle); }
.md-path { font-size: 11px; font-family: var(--font-mono); color: var(--text-quaternary); }

@media (max-width: 768px) {
  .kb-layout { grid-template-columns: 1fr; height: auto; }
  .tree-panel { max-height: 250px; }
  .md-panel { min-height: 400px; }
}
</style>
