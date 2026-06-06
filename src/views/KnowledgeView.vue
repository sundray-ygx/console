<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNotion } from '../composables/useNotion'

interface RecentItem {
  id: string
  title: string
  category: string | null
  tags: string[]
  updated: string | null
}

interface SubStats {
  total: number
  recentWeek: number
}

interface TopicStat {
  name: string
  count: number
  recentWeek: number
}

interface KnowledgeOverview {
  stats: {
    library: SubStats
    material: SubStats
    inspiration: SubStats
    treasure: SubStats
  }
  recent: {
    library: RecentItem[]
    material: RecentItem[]
    inspiration: RecentItem[]
    treasure: RecentItem[]
  }
  topicStats: TopicStat[]
}

const { fetchKnowledge, loading, error } = useNotion()

const overview = ref<KnowledgeOverview | null>(null)

const subLibraries = [
  { key: 'library' as const, label: '图书馆', icon: '📚' },
  { key: 'material' as const, label: '资料搜集', icon: '📎' },
  { key: 'inspiration' as const, label: '灵感文档', icon: '💡' },
  { key: 'treasure' as const, label: '宝藏库', icon: '💎' },
]

const maxTopicCount = computed(() => {
  if (!overview.value?.topicStats?.length) return 0
  return Math.max(...overview.value.topicStats.map(t => t.count), 1)
})

onMounted(async () => {
  const data = await fetchKnowledge()
  if (data) {
    overview.value = data as KnowledgeOverview
  }
})

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}
</script>

<template>
  <div class="knowledge">
    <h1 class="page-title">Notion 知识库</h1>
    <p class="page-subtitle">个人知识管理体系 · 收集 · 整理 · 输出</p>

    <div v-if="loading && !overview" class="loading-state">
      <span class="loading-spinner">⟳</span>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠</span>
      <p>{{ error }}</p>
    </div>

    <template v-else-if="overview">
      <!-- Section 1: Stats Cards -->
      <div class="stats-row">
        <div v-for="lib in subLibraries" :key="lib.key" class="stat-card">
          <div class="stat-header">
            <span class="stat-icon">{{ lib.icon }}</span>
            <span class="stat-label">{{ lib.label }}</span>
          </div>
          <div class="stat-total">{{ overview.stats[lib.key].total }}</div>
          <div v-if="overview.stats[lib.key].recentWeek > 0" class="stat-recent">
            本周 +{{ overview.stats[lib.key].recentWeek }}
          </div>
        </div>
      </div>

      <!-- Section 2: Recent Items -->
      <div class="section-label">最近更新</div>
      <div class="recent-grid">
        <div v-for="lib in subLibraries" :key="lib.key" class="recent-column">
          <div class="recent-column-header">
            <span class="recent-column-icon">{{ lib.icon }}</span>
            <span class="recent-column-title">{{ lib.label }}</span>
          </div>
          <div class="recent-items">
            <div v-if="overview.recent[lib.key].length === 0" class="recent-empty">暂无内容</div>
            <div
              v-for="item in overview.recent[lib.key]"
              :key="item.id"
              class="recent-item"
            >
              <div class="recent-item-title">{{ item.title }}</div>
              <div class="recent-item-footer">
                <div v-if="item.tags.length" class="recent-item-tags">
                  <span v-for="tag in item.tags.slice(0, 2)" :key="tag" class="tag">{{ tag }}</span>
                </div>
                <span v-if="item.updated" class="recent-item-date">{{ formatDate(item.updated) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 3: Topic Stats -->
      <div v-if="overview.topicStats.length > 0" class="section-label">主题分布</div>
      <div v-if="overview.topicStats.length > 0" class="topic-chart">
        <div v-for="topic in overview.topicStats" :key="topic.name" class="topic-row">
          <div class="topic-name">{{ topic.name }}</div>
          <div class="topic-bar-wrapper">
            <div
              class="topic-bar"
              :style="{ width: (topic.count / maxTopicCount * 100) + '%' }"
            ></div>
          </div>
          <div class="topic-count">{{ topic.count }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.knowledge {
  padding-top: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 510;
  letter-spacing: -0.6px;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-tertiary);
  margin-bottom: 24px;
}

.loading-state,
.error-state {
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

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 28px;
}

/* ── Section 1: Stats Cards ── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 28px;
}

.stat-card {
  padding: 16px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  transition: border-color 0.15s;
}

.stat-card:hover {
  border-color: var(--border-standard);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.stat-icon {
  font-size: 18px;
}

.stat-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-tertiary);
}

.stat-total {
  font-size: 28px;
  font-weight: 600;
  font-family: var(--font-mono);
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 6px;
}

.stat-recent {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
}

/* ── Section Labels ── */
.section-label {
  font-size: 13px;
  font-weight: 510;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.section-label:not(:first-of-type) {
  margin-top: 28px;
}

/* ── Section 2: Recent Items ── */
.recent-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 28px;
}

.recent-column {
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  overflow: hidden;
}

.recent-column-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-panel);
}

.recent-column-icon {
  font-size: 14px;
}

.recent-column-title {
  font-size: 12px;
  font-weight: 510;
  color: var(--text-secondary);
}

.recent-items {
  padding: 6px 0;
}

.recent-empty {
  padding: 16px 14px;
  font-size: 12px;
  color: var(--text-quaternary);
  text-align: center;
}

.recent-item {
  padding: 8px 14px;
  transition: background 0.15s;
  cursor: default;
}

.recent-item:hover {
  background: var(--hover-bg);
}

.recent-item-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.recent-item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.recent-item-tags {
  display: flex;
  gap: 4px;
  overflow: hidden;
  min-width: 0;
}

.tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: var(--radius-pill);
  background: var(--bg-canvas);
  color: var(--text-quaternary);
  border: 1px solid var(--border-subtle);
  white-space: nowrap;
}

.recent-item-date {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-quaternary);
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── Section 3: Topic Stats ── */
.topic-chart {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 28px;
}

.topic-row {
  display: grid;
  grid-template-columns: 120px 1fr 48px;
  align-items: center;
  gap: 12px;
}

.topic-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.topic-bar-wrapper {
  height: 20px;
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  overflow: hidden;
}

.topic-bar {
  height: 100%;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--accent) 50%, transparent);
  min-width: 2px;
  transition: width 0.3s ease;
}

.topic-count {
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-quaternary);
  text-align: right;
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .recent-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
  .recent-grid {
    grid-template-columns: 1fr;
  }
  .topic-row {
    grid-template-columns: 80px 1fr 40px;
    gap: 8px;
  }
}
</style>
