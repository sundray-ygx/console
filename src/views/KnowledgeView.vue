<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNotion } from '../composables/useNotion'

interface Topic {
  id: string
  name: string
  icon?: string
  count?: number
}

interface KnowledgeItem {
  id: string
  title: string
  url: string
  tags?: string[]
  date?: string
  topic?: string
}

const { fetchKnowledge, loading, error } = useNotion()

const activeTab = ref('library')
const topics = ref<Topic[]>([])
const tabs = ref([
  { id: 'library', label: '图书馆', icon: '📚' },
  { id: 'material', label: '资料搜集', icon: '📎' },
  { id: 'inspiration', label: '灵感文档', icon: '💡' },
  { id: 'treasure', label: '宝藏库', icon: '💎' },
])
const items = ref<KnowledgeItem[]>([])
const pagination = ref({ page: 1, size: 20, total: 0 })
const isLoadingMore = ref(false)

onMounted(async () => {
  await loadOverview()
})

async function loadOverview() {
  const data = await fetchKnowledge()
  if (data) {
    topics.value = data.topics || []
    // Load initial items for first tab
    if (tabs.value.length > 0) {
      await loadTabItems(tabs.value[0].id)
    }
  }
}

async function loadTabItems(tab: string, reset: boolean = true) {
  if (reset) {
    items.value = []
    pagination.value.page = 1
  }

  const page = pagination.value.page
  const size = pagination.value.size

  const data = await fetchKnowledge(tab, page, size)
  if (data) {
    if (reset) {
      items.value = data.items || []
    } else {
      items.value = [...items.value, ...(data.items || [])]
    }
    pagination.value.total = data.total || 0
  }
}

async function handleTabChange(tabId: string) {
  activeTab.value = tabId
  await loadTabItems(tabId, true)
}

async function loadMore() {
  if (isLoadingMore.value || items.value.length >= pagination.value.total) return
  isLoadingMore.value = true
  pagination.value.page++
  await loadTabItems(activeTab.value, false)
  isLoadingMore.value = false
}

const canLoadMore = computed(() => items.value.length < pagination.value.total)
</script>

<template>
  <div class="knowledge">
    <h1 class="page-title">Notion 知识库</h1>
    <p class="page-subtitle">个人知识管理体系 · 收集 · 整理 · 输出</p>

    <div v-if="loading && topics.length === 0" class="loading-state">
      <span class="loading-spinner">⟳</span>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{{ error }}</p>
    </div>

    <template v-else>
      <!-- Topics Grid -->
      <div class="topics-grid">
        <div v-for="topic in topics" :key="topic.id" class="topic-card">
          <span class="topic-icon">{{ topic.icon || '📁' }}</span>
          <span class="topic-name">{{ topic.name }}</span>
          <span class="topic-count">{{ topic.count || 0 }} 篇</span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab"
          :class="{ active: activeTab === tab.id }"
          @click="handleTabChange(tab.id)"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>

      <!-- Content -->
      <div v-if="loading && items.length === 0" class="loading-state">
        <span class="loading-spinner">⟳</span>
        <p>加载中...</p>
      </div>

      <div v-else class="items-list">
        <div v-if="items.length === 0" class="empty-state">
          <span class="empty-icon">📭</span>
          <p>暂无内容</p>
        </div>

        <a
          v-for="item in items"
          :key="item.id"
          :href="item.url"
          target="_blank"
          class="item-row"
        >
          <div class="item-info">
            <span class="item-title">{{ item.title }}</span>
            <div class="item-meta">
              <span v-if="item.topic" class="item-category">{{ item.topic }}</span>
              <span v-if="item.date" class="item-date">{{ item.date }}</span>
            </div>
          </div>
          <div v-if="item.tags && item.tags.length" class="item-tags">
            <span v-for="tag in item.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </a>

        <button
          v-if="canLoadMore"
          class="load-more-btn"
          :disabled="isLoadingMore"
          @click="loadMore"
        >
          {{ isLoadingMore ? '加载中...' : '查看更多' }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.knowledge { padding-top: 32px; }
.page-title { font-size: 28px; font-weight: 510; letter-spacing: -0.6px; color: var(--text-primary); margin-bottom: 4px; }
.page-subtitle { font-size: 14px; color: var(--text-tertiary); margin-bottom: 24px; }

.loading-state, .error-state, .empty-state {
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
.error-icon, .empty-icon { font-size: 28px; }

/* Topics */
.topics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px; }
.topic-card {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px; border-radius: 10px;
  border: 1px solid var(--border-subtle); cursor: pointer;
  transition: all 0.15s;
  background: rgba(255,255,255,0.02);
}
.topic-card:hover { border-color: var(--border-standard); transform: translateY(-1px); }
.topic-icon { font-size: 22px; }
.topic-name { font-size: 13px; font-weight: 510; color: var(--text-secondary); flex: 1; }
.topic-count { font-size: 11px; font-family: var(--font-mono); color: var(--text-quaternary); }

/* Tabs */
.tabs { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0; }
.tab {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 16px; background: none; border: none;
  font-size: 13px; color: var(--text-quaternary); cursor: pointer;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
  transition: all 0.15s; font-family: var(--font-sans);
}
.tab:hover { color: var(--text-tertiary); }
.tab.active { color: var(--accent); border-bottom-color: var(--accent); }
.tab-icon { font-size: 14px; }
.tab-label { font-weight: 510; }

/* Items */
.items-list { display: flex; flex-direction: column; gap: 2px; }
.item-row {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 12px 16px; border-radius: 8px; transition: background 0.15s;
  text-decoration: none;
}
.item-row:hover { background: rgba(255,255,255,0.03); }
.item-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
.item-title { font-size: 13px; font-weight: 500; color: var(--text-secondary); }
.item-meta { display: flex; align-items: center; gap: 8px; }
.item-category { font-size: 11px; color: var(--accent); }
.item-date { font-size: 11px; font-family: var(--font-mono); color: var(--text-quaternary); }
.item-tags { display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
.tag {
  font-size: 10px; padding: 2px 8px; border-radius: 10px;
  background: rgba(255,255,255,0.04); color: var(--text-quaternary);
  border: 1px solid var(--border-subtle);
}

.load-more-btn {
  margin-top: 16px;
  padding: 10px 20px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  align-self: center;
}
.load-more-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.06);
  border-color: var(--border-standard);
}
.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .topics-grid { grid-template-columns: 1fr 1fr; }
  .item-row { flex-direction: column; align-items: flex-start; gap: 8px; }
}
</style>
