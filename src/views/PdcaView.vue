<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNotion } from '../composables/useNotion'

interface Period {
  id: string
  title: string
  type: 'year' | 'quarter' | 'month' | 'week' | 'day'
  url?: string
  score?: string
  objectives?: string[]
  krs?: string[]
  plan?: string
  review?: string
  projects?: string[]
  tasks?: string[]
  children?: Period[]
}

const { fetchPdcaTimeline, loading, error } = useNotion()

const timeline = ref<Period[]>([])
const selectedId = ref<string>('')
const expandedNodes = ref<Set<string>>(new Set())
let refreshInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await loadTimeline()
  // Auto-refresh every 5 minutes
  refreshInterval = setInterval(loadTimeline, 5 * 60 * 1000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})

async function loadTimeline() {
  const data = await fetchPdcaTimeline()
  if (data?.timeline) {
    timeline.value = data.timeline
    // Auto-expand years and quarters
    timeline.value.forEach(year => {
      expandedNodes.value.add(year.id)
      year.children?.forEach(quarter => {
        expandedNodes.value.add(quarter.id)
      })
    })
    // Select first week by default
    if (!selectedId.value) {
      const firstWeek = findFirstWeek(timeline.value)
      if (firstWeek) selectedId.value = firstWeek.id
    }
  }
}

function findFirstWeek(items: Period[]): Period | null {
  for (const item of items) {
    if (item.type === 'week') return item
    if (item.children) {
      const found = findFirstWeek(item.children)
      if (found) return found
    }
  }
  return null
}

function findPeriod(id: string, list?: Period[]): Period | null {
  const items = list || timeline.value
  for (const p of items) {
    if (p.id === id) return p
    if (p.children) {
      const found = findPeriod(id, p.children)
      if (found) return found
    }
  }
  return null
}

function toggleExpand(path: string) {
  if (expandedNodes.value.has(path)) {
    expandedNodes.value.delete(path)
  } else {
    expandedNodes.value.add(path)
  }
}

function isExpanded(path: string): boolean {
  return expandedNodes.value.has(path)
}

function handleClick(node: Period) {
  if (node.children && node.children.length > 0) {
    toggleExpand(node.id)
  }
  selectedId.value = node.id
}

function typeLabel(t: string) {
  const map: Record<string, string> = { year: '年度', quarter: '季度', month: '月度', week: '周', day: '日' }
  return map[t] || t
}

function isCurrent(id: string) { return id === selectedId.value }

const currentPeriod = computed(() => findPeriod(selectedId.value))

function renderTree(items: Period[]): Period[] {
  const result: Period[] = []
  for (const item of items) {
    result.push(item)
    if (item.children && isExpanded(item.id)) {
      result.push(...renderTree(item.children))
    }
  }
  return result
}

const flatTree = computed(() => renderTree(timeline.value))

function getDepth(item: Period, items: Period[], depth: number = 0): number {
  for (const i of items) {
    if (i.id === item.id) return depth
    if (i.children) {
      const d = getDepth(item, i.children, depth + 1)
      if (d >= 0) return d
    }
  }
  return -1
}
</script>

<template>
  <div class="pdca">
    <h1 class="page-title">PDCA 看板</h1>
    <p class="page-subtitle">计划 → 执行 → 检查 → 改进</p>

    <div v-if="loading && timeline.length === 0" class="loading-state">
      <span class="loading-spinner">⟳</span>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{{ error }}</p>
    </div>

    <div v-else class="pdca-layout">
      <!-- Left: Timeline Tree -->
      <div class="timeline-panel">
        <div v-for="item in flatTree" :key="item.id" class="tree-node">
          <div
            class="tree-item"
            :class="[
              item.type,
              { active: isCurrent(item.id) }
            ]"
            @click="handleClick(item)"
          >
            <span class="tree-dot" :class="{ active: isCurrent(item.id) }"></span>
            <span class="tree-label">{{ item.title }}</span>
            <span v-if="item.type === 'year'" class="tree-type">{{ typeLabel(item.type) }}</span>
          </div>
        </div>
      </div>

      <!-- Right: Detail Panel -->
      <div class="detail-panel" v-if="currentPeriod">
        <div class="detail-header">
          <span class="detail-type">{{ typeLabel(currentPeriod.type) }}</span>
          <h2 class="detail-title">{{ currentPeriod.title }}</h2>
          <a v-if="currentPeriod.url" :href="currentPeriod.url" target="_blank" class="detail-link">在 Notion 中查看 →</a>
        </div>

        <div class="pdca-cards">
          <div class="pdca-card plan" v-if="currentPeriod.plan">
            <div class="pdca-label">Plan <span class="pdca-icon">📋</span></div>
            <p class="pdca-text">{{ currentPeriod.plan }}</p>
          </div>
          <div class="pdca-card do" v-if="currentPeriod.review">
            <div class="pdca-label">Do <span class="pdca-icon">⚡</span></div>
            <p class="pdca-text">{{ currentPeriod.review }}</p>
          </div>
          <div class="pdca-card check" v-if="currentPeriod.score">
            <div class="pdca-label">Score <span class="pdca-icon">🔍</span></div>
            <p class="pdca-text">{{ currentPeriod.score }}</p>
          </div>
          <div class="pdca-card act" v-if="currentPeriod.objectives || currentPeriod.krs || currentPeriod.projects || currentPeriod.tasks">
            <div class="pdca-label">Links <span class="pdca-icon">🔗</span></div>
            <div class="pdca-links">
              <div v-if="currentPeriod.objectives && currentPeriod.objectives.length">
                <span class="link-label">Objectives:</span> {{ currentPeriod.objectives.length }} 个
              </div>
              <div v-if="currentPeriod.krs && currentPeriod.krs.length">
                <span class="link-label">KRs:</span> {{ currentPeriod.krs.length }} 个
              </div>
              <div v-if="currentPeriod.projects && currentPeriod.projects.length">
                <span class="link-label">Projects:</span> {{ currentPeriod.projects.length }} 个
              </div>
              <div v-if="currentPeriod.tasks && currentPeriod.tasks.length">
                <span class="link-label">Tasks:</span> {{ currentPeriod.tasks.length }} 个
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pdca { padding-top: 32px; }
.page-title { font-size: 28px; font-weight: 510; letter-spacing: -0.6px; color: var(--text-primary); margin-bottom: 4px; }
.page-subtitle { font-size: 14px; color: var(--text-tertiary); margin-bottom: 24px; }

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--text-tertiary);
}
.loading-spinner {
  font-size: 32px;
  animation: spin 1s linear infinite;
}
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.error-icon { font-size: 32px; }

.pdca-layout { display: grid; grid-template-columns: 280px 1fr; gap: 24px; }

/* Timeline */
.timeline-panel { background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 16px; }
.tree-node { margin-bottom: 2px; }
.tree-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px; border-radius: 6px; cursor: pointer;
  transition: background 0.15s;
}
.tree-item:hover { background: rgba(255,255,255,0.04); }
.tree-item.active { background: rgba(113,112,255,0.1); }
.tree-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--text-quaternary); flex-shrink: 0;
}
.tree-dot.active { background: var(--accent); }
.tree-label { font-size: 13px; color: var(--text-secondary); }
.tree-item.active .tree-label { color: var(--accent); font-weight: 510; }
.tree-type { font-size: 10px; color: var(--text-quaternary); margin-left: auto; }

.tree-item.year .tree-label { font-weight: 510; font-size: 14px; color: var(--text-primary); }
.tree-item.quarter .tree-label { font-weight: 500; }
.tree-item.month { padding-left: 24px; }
.tree-item.week { padding-left: 40px; }
.tree-item.day { padding-left: 56px; }

/* Detail */
.detail-panel { background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 24px; }
.detail-header { margin-bottom: 16px; }
.detail-type { font-size: 10px; font-weight: 510; color: var(--accent); text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 4px; }
.detail-title { font-size: 22px; font-weight: 510; color: var(--text-primary); letter-spacing: -0.4px; }
.detail-link { font-size: 12px; color: var(--accent); text-decoration: none; margin-top: 8px; display: inline-block; }
.detail-link:hover { text-decoration: underline; }

.pdca-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.pdca-card { padding: 16px; border-radius: 10px; border: 1px solid var(--border-subtle); }
.pdca-card.plan { background: rgba(113,112,255,0.04); border-color: rgba(113,112,255,0.1); }
.pdca-card.do { background: rgba(16,185,129,0.04); border-color: rgba(16,185,129,0.1); }
.pdca-card.check { background: rgba(251,191,36,0.04); border-color: rgba(251,191,36,0.1); }
.pdca-card.act { background: rgba(239,68,68,0.04); border-color: rgba(239,68,68,0.1); }
.pdca-label { font-size: 12px; font-weight: 510; color: var(--text-secondary); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
.pdca-icon { font-size: 14px; }
.pdca-text { font-size: 12px; color: var(--text-tertiary); line-height: 1.6; white-space: pre-line; }
.pdca-links { font-size: 12px; color: var(--text-tertiary); line-height: 1.8; }
.link-label { font-weight: 510; color: var(--text-secondary); }

@media (max-width: 768px) {
  .pdca-layout { grid-template-columns: 1fr; }
  .pdca-cards { grid-template-columns: 1fr; }
}
</style>
