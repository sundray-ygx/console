<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNotion } from '../composables/useNotion'

interface Project { id: string; title: string; progress: number; status: string | null; url: string }
interface KeyResult { id: string; title: string; score: number; progress: number; status: string | null; projects: Project[]; url: string; expanded: boolean }
interface Objective { id: string; title: string; status: string | null; period: string | null; priority: string | null; krs: KeyResult[]; url: string; expanded: boolean }
interface Domain { id: string; name: string; category: string | null; objectives: Objective[]; expanded: boolean }

const { loading, error, fetchOkr } = useNotion()

const allDomains = ref<Domain[]>([])
let refreshInterval: ReturnType<typeof setInterval> | null = null

const WORK_CATEGORIES = ['💼 工作']

const workDomains = computed(() =>
  allDomains.value.filter(d => d.category === '💼 工作' && d.objectives.length > 0)
)
const lifeDomains = computed(() =>
  allDomains.value.filter(d => d.category !== '💼 工作' && d.objectives.length > 0)
)

async function loadData() {
  const result = await fetchOkr('进行中')
  if (result) {
    allDomains.value = (result.domains || []).map((d: any) => ({
      ...d,
      expanded: true,
      objectives: (d.objectives || []).map((o: any) => ({
        ...o,
        expanded: false,
      }))
    }))
  }
}

function krProgress(kr: KeyResult) { return kr.score || kr.progress || 0 }
function objProgress(obj: Objective) {
  if (!obj.krs.length) return 0
  return Math.round(obj.krs.reduce((s, kr) => s + krProgress(kr), 0) / obj.krs.length)
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
  allDomains.value.forEach(d => d.objectives.forEach(o => o.krs.forEach(kr => {
    sum += krProgress(kr); count++
  })))
  return count > 0 ? Math.round(sum / count) : 0
})

onMounted(() => {
  loadData()
  refreshInterval = setInterval(loadData, 300000)
})
onUnmounted(() => { if (refreshInterval) clearInterval(refreshInterval) })
</script>

<template>
  <div class="okr">
    <div v-if="loading && allDomains.length === 0" class="loading-state">
      <span class="loading-spinner">⟳</span>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{{ error }}</p>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="okr-header">
        <div>
          <h1 class="page-title">OKR 看板</h1>
          <p class="page-subtitle">2026 · 进行中的目标与关键结果</p>
        </div>
        <div class="overall">
          <span class="overall-pct" :style="{ color: progressColor(totalProgress) }">{{ totalProgress }}%</span>
          <span class="overall-label">整体进度</span>
        </div>
      </div>

      <!-- Work Section -->
      <div v-if="workDomains.length > 0" class="section">
        <h2 class="section-title"><span class="section-dot work"></span>工作</h2>
        <div class="domains-grid">
          <div v-for="domain in workDomains" :key="domain.id" class="domain-card">
            <div class="domain-header" @click="toggleDomain(domain)">
              <span class="domain-name">{{ domain.name }}</span>
              <span class="domain-count">{{ domain.objectives.length }}</span>
              <svg class="chevron" :class="{ rotated: domain.expanded }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>

            <div v-if="domain.expanded" class="domain-body">
              <div v-for="obj in domain.objectives" :key="obj.id" class="obj-block">
                <div class="obj-header" @click="toggleObjective(obj)">
                  <svg class="chevron sm" :class="{ rotated: obj.expanded }" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                  <span class="obj-title">{{ obj.title }}</span>
                  <div class="progress-bar"><div class="progress-fill" :style="{ width: objProgress(obj) + '%', background: progressColor(objProgress(obj)) }"></div></div>
                  <span class="pct" :style="{ color: progressColor(objProgress(obj)) }">{{ objProgress(obj) }}%</span>
                </div>

                <div v-if="obj.expanded" class="kr-list">
                  <div v-for="kr in obj.krs" :key="kr.id" class="kr-block">
                    <div class="kr-header">
                      <span class="kr-title">{{ kr.title }}</span>
                      <span class="pct sm" :style="{ color: progressColor(krProgress(kr)) }">{{ krProgress(kr) }}%</span>
                    </div>
                    <div class="progress-bar sm"><div class="progress-fill" :style="{ width: krProgress(kr) + '%', background: progressColor(krProgress(kr)) }"></div></div>
                    <div v-if="kr.projects.length" class="project-list">
                      <div v-for="p in kr.projects" :key="p.id" class="project-item">
                        <span class="project-status" :class="p.status">{{ p.status || '—' }}</span>
                        <span class="project-title">{{ p.title }}</span>
                        <span class="project-pct">{{ p.progress }}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Life Section -->
      <div v-if="lifeDomains.length > 0" class="section">
        <h2 class="section-title"><span class="section-dot life"></span>生活</h2>
        <div class="domains-grid">
          <div v-for="domain in lifeDomains" :key="domain.id" class="domain-card">
            <div class="domain-header" @click="toggleDomain(domain)">
              <span class="domain-name">{{ domain.name }}</span>
              <span class="domain-count">{{ domain.objectives.length }}</span>
              <svg class="chevron" :class="{ rotated: domain.expanded }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>

            <div v-if="domain.expanded" class="domain-body">
              <div v-for="obj in domain.objectives" :key="obj.id" class="obj-block">
                <div class="obj-header" @click="toggleObjective(obj)">
                  <svg class="chevron sm" :class="{ rotated: obj.expanded }" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                  <span class="obj-title">{{ obj.title }}</span>
                  <div class="progress-bar"><div class="progress-fill" :style="{ width: objProgress(obj) + '%', background: progressColor(objProgress(obj)) }"></div></div>
                  <span class="pct" :style="{ color: progressColor(objProgress(obj)) }">{{ objProgress(obj) }}%</span>
                </div>

                <div v-if="obj.expanded" class="kr-list">
                  <div v-for="kr in obj.krs" :key="kr.id" class="kr-block">
                    <div class="kr-header">
                      <span class="kr-title">{{ kr.title }}</span>
                      <span class="pct sm" :style="{ color: progressColor(krProgress(kr)) }">{{ krProgress(kr) }}%</span>
                    </div>
                    <div class="progress-bar sm"><div class="progress-fill" :style="{ width: krProgress(kr) + '%', background: progressColor(krProgress(kr)) }"></div></div>
                    <div v-if="kr.projects.length" class="project-list">
                      <div v-for="p in kr.projects" :key="p.id" class="project-item">
                        <span class="project-status" :class="p.status">{{ p.status || '—' }}</span>
                        <span class="project-title">{{ p.title }}</span>
                        <span class="project-pct">{{ p.progress }}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="workDomains.length === 0 && lifeDomains.length === 0" class="empty-state">
        <p>暂无进行中的目标</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.okr { padding-top: 32px; }

.loading-state, .error-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 60px 20px; color: var(--text-tertiary);
}
.loading-spinner { font-size: 28px; animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.error-icon { font-size: 28px; }

/* Header */
.okr-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
.page-title { font-size: 28px; font-weight: 510; letter-spacing: -0.6px; color: var(--text-primary); margin-bottom: 4px; }
.page-subtitle { font-size: 14px; color: var(--text-tertiary); }
.overall { text-align: right; }
.overall-pct { font-size: 32px; font-weight: 510; font-variant-numeric: tabular-nums; display: block; }
.overall-label { font-size: 12px; color: var(--text-quaternary); }

/* Sections */
.section { margin-bottom: 28px; }
.section-title {
  display: flex; align-items: center; gap: 10px;
  font-size: 16px; font-weight: 510; color: var(--text-secondary); margin-bottom: 14px;
}
.section-dot { width: 8px; height: 8px; border-radius: 50%; }
.section-dot.work { background: #7170ff; }
.section-dot.life { background: #10b981; }

/* Domains Grid */
.domains-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 14px; }

.domain-card {
  border: 1px solid var(--border-subtle); border-radius: 12px;
  background: var(--bg-surface); overflow: hidden;
}
.domain-header {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px; cursor: pointer; transition: background 0.15s;
}
.domain-header:hover { background: var(--hover-bg); }
.domain-name { font-size: 14px; font-weight: 510; color: var(--text-primary); flex: 1; }
.domain-count {
  font-size: 11px; font-family: var(--font-mono); color: var(--text-quaternary);
  padding: 1px 6px; border-radius: 4px; background: var(--bg-canvas);
}
.chevron { color: var(--text-quaternary); transition: transform 0.2s; flex-shrink: 0; }
.chevron.rotated { transform: rotate(90deg); }

.domain-body { padding: 0 16px 12px; }

/* Objective */
.obj-block { margin-bottom: 4px; }
.obj-header {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 6px; cursor: pointer; transition: background 0.15s;
}
.obj-header:hover { background: var(--hover-bg); }
.obj-title { font-size: 13px; font-weight: 500; color: var(--text-secondary); flex-shrink: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.progress-bar { flex: 1; height: 4px; background: var(--bg-canvas); border-radius: 2px; overflow: hidden; }
.progress-bar.sm { height: 3px; }
.progress-fill { height: 100%; border-radius: 2px; transition: width 0.5s ease; }
.pct { font-size: 12px; font-family: var(--font-mono); font-variant-numeric: tabular-nums; min-width: 36px; text-align: right; }
.pct.sm { font-size: 11px; min-width: 30px; }

/* KR */
.kr-list { padding: 2px 10px 8px 20px; }
.kr-block { margin-bottom: 8px; }
.kr-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.kr-title { font-size: 12px; color: var(--text-tertiary); flex: 1; }

/* Project */
.project-list { margin-top: 6px; padding-left: 12px; }
.project-item {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 4px 0; font-size: 11px;
}
.project-status {
  padding: 1px 5px; border-radius: 3px; font-size: 10px;
  background: color-mix(in srgb, var(--accent) 15%, transparent); color: var(--accent);
}
.project-status.已完成 { background: color-mix(in srgb, #10b981 15%, transparent); color: #10b981; }
.project-status.暂停 { background: color-mix(in srgb, #fbbf24 15%, transparent); color: #fbbf24; }
.project-title { color: var(--text-quaternary); flex: 1; line-height: 1.4; }
.project-pct { font-family: var(--font-mono); color: var(--text-quaternary); }

.empty-state { text-align: center; padding: 60px 0; color: var(--text-quaternary); font-size: 14px; }

@media (max-width: 768px) {
  .domains-grid { grid-template-columns: 1fr; }
}
</style>
