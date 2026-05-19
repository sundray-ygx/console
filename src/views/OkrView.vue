<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNotion } from '../composables/useNotion'

interface KeyResult { id: number; title: string; score: number; status: string; projects: any[]; url: string }
interface Objective { id: number; title: string; status: string; period: string; krs: KeyResult[]; url: string; expanded: boolean }
interface Domain { id: number; name: string; icon: string; objectives: Objective[]; expanded: boolean }

const { loading, error, fetchOkr } = useNotion()

const domains = ref<Domain[]>([])
const statusFilter = ref<string>('') // empty = all
const data = ref<any>(null)
let refreshInterval: ReturnType<typeof setInterval> | null = null

const statusTabs = [
  { key: '', label: '全部' },
  { key: '进行中', label: '进行中' },
  { key: '已完成', label: '已完成' },
  { key: '暂停', label: '暂停' },
]

async function loadData() {
  const result = await fetchOkr(statusFilter.value)
  if (result) {
    data.value = result
    // Map API response to Domain structure
    domains.value = (result.domains || []).map((d: any) => ({
      ...d,
      expanded: true, // Default expanded
      objectives: (d.objectives || []).map((o: any) => ({
        ...o,
        expanded: false, // Default collapsed
      }))
    }))
  }
}

function setActiveStatus(key: string) {
  statusFilter.value = key
  loadData()
}

function krProgress(kr: KeyResult) {
  return kr.score || 0
}

function objProgress(obj: Objective) {
  if (obj.krs.length === 0) return 0
  return Math.round(obj.krs.reduce((sum, kr) => sum + krProgress(kr), 0) / obj.krs.length)
}

function progressColor(pct: number) {
  if (pct >= 80) return '#10b981'
  if (pct >= 50) return '#7170ff'
  return '#f59e0b'
}

function toggleDomain(d: Domain) { d.expanded = !d.expanded }
function toggleObjective(o: Objective) { o.expanded = !o.expanded }

const totalProgress = computed(() => {
  let sum = 0, count = 0
  domains.value.forEach(d => d.objectives.forEach(o => o.krs.forEach(kr => {
    sum += krProgress(kr); count++
  })))
  return count > 0 ? Math.round(sum / count) : 0
})

onMounted(() => {
  loadData()
  refreshInterval = setInterval(loadData, 300000) // 5min auto-refresh
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<template>
  <div class="okr">
    <!-- Loading State -->
    <div v-if="loading && !data" class="loading-state">加载中...</div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <!-- Content -->
    <template v-else>
      <!-- Summary -->
      <div class="okr-header">
        <div>
          <h1 class="page-title">OKR 看板</h1>
          <p class="page-subtitle">{{ data?.period || '2026 Q2' }} · 当季目标与关键结果</p>
        </div>
        <div class="overall">
          <span class="overall-pct" :style="{ color: progressColor(totalProgress) }">{{ totalProgress }}%</span>
          <span class="overall-label">整体进度</span>
        </div>
      </div>

      <!-- Status Filter Bar -->
      <div class="status-filter">
        <button
          v-for="tab in statusTabs"
          :key="tab.key"
          class="status-tab"
          :class="{ active: statusFilter === tab.key }"
          @click="setActiveStatus(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Domain Tree -->
      <div v-for="domain in domains" :key="domain.id" class="domain-block">
        <div class="domain-header" @click="toggleDomain(domain)">
          <svg class="chevron" :class="{ rotated: domain.expanded }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          <span class="domain-icon">{{ domain.icon }}</span>
          <span class="domain-name">{{ domain.name }}</span>
          <span class="domain-count">{{ domain.objectives.length }} 个目标</span>
        </div>

        <div v-if="domain.expanded" class="objectives">
          <div v-for="obj in domain.objectives" :key="obj.id" class="objective-block">
            <a class="obj-header" :href="obj.url" target="_blank" @click.prevent="toggleObjective(obj)">
              <svg class="chevron sm" :class="{ rotated: obj.expanded }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
              <span class="obj-title">{{ obj.title }}</span>
              <div class="obj-bar">
                <div class="obj-bar-fill" :style="{ width: objProgress(obj) + '%', background: progressColor(objProgress(obj)) }"></div>
              </div>
              <span class="obj-pct" :style="{ color: progressColor(objProgress(obj)) }">{{ objProgress(obj) }}%</span>
            </a>

            <div v-if="obj.expanded" class="krs">
              <a v-for="kr in obj.krs" :key="kr.id" class="kr-item" :href="kr.url" target="_blank">
                <div class="kr-info">
                  <span class="kr-title">{{ kr.title }}</span>
                  <span class="kr-score">{{ kr.score }}%</span>
                </div>
                <div class="kr-bar">
                  <div class="kr-bar-fill" :style="{ width: krProgress(kr) + '%', background: progressColor(krProgress(kr)) }"></div>
                </div>
                <span class="kr-pct" :style="{ color: progressColor(krProgress(kr)) }">{{ krProgress(kr) }}%</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="domains.length === 0" class="empty-state">
        <span class="empty-icon">🎯</span>
        <p class="empty-text">还没有设置任何 OKR 目标</p>
        <p class="empty-sub">在 Notion 中创建你的第一个目标与关键结果</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.okr { padding-top: 32px; }

/* Loading & Error States */
.loading-state, .error-state {
  text-align: center; padding: 60px 0; font-size: 14px; color: var(--text-tertiary);
}
.error-state { color: #ef4444; }

/* Status Filter */
.status-filter {
  display: flex; gap: 8px; margin-bottom: 24px; padding-bottom: 16px;
  border-bottom: 1px solid var(--border-subtle);
}
.status-tab {
  padding: 6px 16px; font-size: 13px; font-weight: 500; color: var(--text-tertiary);
  background: transparent; border: none; border-radius: 8px; cursor: pointer;
  transition: all 0.2s;
}
.status-tab:hover { color: var(--text-secondary); background: rgba(255,255,255,0.03); }
.status-tab.active {
  color: var(--accent); background: rgba(113,112,255,0.1);
}

.okr-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
.page-title { font-size: 28px; font-weight: 510; letter-spacing: -0.6px; color: var(--text-primary); margin-bottom: 4px; }
.page-subtitle { font-size: 14px; color: var(--text-tertiary); }
.overall { text-align: right; }
.overall-pct { font-size: 32px; font-weight: 510; font-variant-numeric: tabular-nums; display: block; }
.overall-label { font-size: 12px; color: var(--text-quaternary); }

/* Domain */
.domain-block { margin-bottom: 8px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 12px; overflow: hidden; }
.domain-header {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 18px; cursor: pointer; transition: background 0.15s;
}
.domain-header:hover { background: rgba(255,255,255,0.03); }
.domain-icon { font-size: 18px; }
.domain-name { font-size: 15px; font-weight: 510; color: var(--text-primary); }
.domain-count { font-size: 11px; color: var(--text-quaternary); margin-left: auto; }
.chevron { color: var(--text-quaternary); transition: transform 0.2s; flex-shrink: 0; }
.chevron.rotated { transform: rotate(90deg); }
.chevron.sm { width: 12px; height: 12px; }

/* Objective */
.objectives { padding: 0 18px 12px; }
.objective-block { margin-bottom: 6px; }
.obj-header {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: 8px; cursor: pointer; transition: background 0.15s;
  text-decoration: none; color: inherit;
}
.obj-header:hover { background: rgba(255,255,255,0.03); }
.obj-title { font-size: 13px; font-weight: 510; color: var(--text-secondary); min-width: 0; }
.obj-bar { flex: 1; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; margin: 0 8px; }
.obj-bar-fill { height: 100%; border-radius: 2px; transition: width 0.5s ease; }
.obj-pct { font-size: 12px; font-family: var(--font-mono); font-variant-numeric: tabular-nums; min-width: 36px; text-align: right; }

/* KR */
.krs { padding: 4px 14px 10px 36px; }
.kr-item {
  display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border-subtle);
  text-decoration: none; color: inherit;
}
.kr-item:last-child { border-bottom: none; }
.kr-info { display: flex; flex-direction: column; min-width: 200px; }
.kr-title { font-size: 12px; color: var(--text-tertiary); }
.kr-nums { font-size: 11px; font-family: var(--font-mono); color: var(--text-quaternary); }
.kr-bar { flex: 1; height: 3px; background: rgba(255,255,255,0.04); border-radius: 2px; overflow: hidden; }
.kr-bar-fill { height: 100%; border-radius: 2px; transition: width 0.5s ease; }
.kr-pct { font-size: 11px; font-family: var(--font-mono); font-variant-numeric: tabular-nums; min-width: 32px; text-align: right; }

/* Empty */
.empty-state { text-align: center; padding: 60px 0; }
.empty-icon { font-size: 40px; display: block; margin-bottom: 12px; }
.empty-text { font-size: 16px; font-weight: 510; color: var(--text-secondary); margin-bottom: 4px; }
.empty-sub { font-size: 13px; color: var(--text-quaternary); }
</style>
