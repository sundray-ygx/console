<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { bookmarks, services } from '../config/services'
import MetricBar from '../components/MetricBar.vue'
import { useSystem } from '../composables/useSystem'
import { useNotion } from '../composables/useNotion'

// ── Composables ──
const { data: sys, refresh: refreshSystem } = useSystem(10000)
const { fetchDashboard } = useNotion()

// ── State ──
const searchQuery = ref('')
const searchFocused = ref(false)
const now = ref(new Date())
const notionData = ref<any>(null)
const notionLoading = ref(false)
const notionError = ref<string | null>(null)

const greeting = computed(() => {
  const h = now.value.getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  if (h < 23) return '晚上好'
  return '夜深了'
})
const dateStr = computed(() => {
  const d = now.value
  const days = ['日','一','二','三','四','五','六']
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 周${days[d.getDay()]}`
})

const filteredBookmarks = computed(() => {
  if (!searchQuery.value.trim()) return null
  const q = searchQuery.value.toLowerCase()
  return bookmarks.filter(b => b.name.toLowerCase().includes(q))
})

// ── Data fetching ──
async function refreshNotion() {
  notionLoading.value = true
  notionError.value = null
  try {
    notionData.value = await fetchDashboard()
  } catch (e: any) {
    notionError.value = e.message
  } finally {
    notionLoading.value = false
  }
}

function tick() { now.value = new Date() }

function fmtBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB'
  return (bytes / 1073741824).toFixed(1) + ' GB'
}
function fmtUptime(seconds: number) {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  return d > 0 ? `${d}天 ${h}小时` : `${h}小时`
}

// Priority dot color based on priority string
function priorityColor(p: string): string {
  if (!p) return 'var(--text-quaternary)'
  const pl = p.toLowerCase()
  if (pl.includes('高') || pl.includes('high') || pl.includes('urgent')) return '#ef4444'
  if (pl.includes('中') || pl.includes('medium')) return '#f59e0b'
  if (pl.includes('低') || pl.includes('low')) return '#10b981'
  return 'var(--text-quaternary)'
}

// Progress bar color based on percentage
function progressColor(pct: number): string {
  if (pct >= 80) return '#10b981'
  if (pct >= 50) return '#8b5cf6'
  return '#f59e0b'
}

// Score stars display
function scoreStars(score: number): string {
  const full = Math.floor(score / 20)
  const half = score % 20 >= 10
  return '★'.repeat(full) + (half ? '½' : '')
}

let timer: ReturnType<typeof setInterval> | null = null
let notionTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  tick()
  refreshNotion()
  timer = setInterval(tick, 1000)
  notionTimer = setInterval(refreshNotion, 30000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (notionTimer) clearInterval(notionTimer)
})
</script>

<template>
  <div class="dashboard">
    <!-- Hero: Greeting -->
    <section class="hero">
      <h1 class="hero-title">{{ greeting }}，Boss</h1>
      <p class="hero-date">{{ dateStr }}</p>
    </section>

    <!-- Search box -->
    <div class="search-box" :class="{ focused: searchFocused }">
      <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      <input v-model="searchQuery" @focus="searchFocused = true" @blur="searchFocused = false" placeholder="搜索服务或工具..." class="search-input" />
      <kbd class="search-kbd">/</kbd>
    </div>

    <!-- Search Results -->
    <section v-if="filteredBookmarks?.length" class="search-results">
      <div v-if="filteredBookmarks?.length" class="sr-group">
        <span class="sr-label">工具</span>
        <a v-for="b in filteredBookmarks" :key="b.name" :href="b.url" target="_blank" class="sr-item">
          <span class="sr-emoji">{{ b.icon }}</span>
          <span class="sr-name">{{ b.name }}</span>
        </a>
      </div>
    </section>

    <!-- Today Overview -->
    <section class="section" v-if="notionData?.today">
      <div class="section-header">
        <svg class="section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span class="section-title">今日概览</span>
        <div class="section-line"></div>
        <span class="section-extra" v-if="notionData.today.stats">{{ notionData.today.stats.pendingTodos }} 待办 / {{ notionData.today.stats.activeTasks }} 任务</span>
      </div>
      <div class="today-grid" v-if="notionData.today.stats">
        <div class="today-stat">
          <span class="ts-value">{{ notionData.today.stats.pendingTodos }}</span>
          <span class="ts-label">待办</span>
        </div>
        <div class="today-stat">
          <span class="ts-value">{{ notionData.today.stats.activeTasks }}</span>
          <span class="ts-label">任务</span>
        </div>
        <div class="today-stat">
          <span class="ts-value">{{ notionData.today.stats.habitRate }}%</span>
          <span class="ts-label">习惯完成</span>
        </div>
      </div>
      <div class="todo-list" v-if="notionData.today.todoList?.length">
        <a v-for="todo in notionData.today.todoList.slice(0, 5)" :key="todo.id" :href="todo.url" target="_blank" class="todo-item">
          <span class="todo-priority" :style="{background: priorityColor(todo.priority)}"></span>
          <span class="todo-text">{{ todo.title }}</span>
        </a>
      </div>
    </section>

    <!-- OKR & PDCA side by side -->
    <div class="split-row">
      <section class="section" v-if="notionData?.okr">
        <div class="section-header">
          <svg class="section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <span class="section-title">OKR 进度</span>
          <div class="section-line"></div>
        </div>
        <div class="okr-list">
          <a v-for="okr in notionData.okr" :key="okr.id" :href="okr.url" target="_blank" class="okr-item">
            <div class="okr-header">
              <span class="okr-title">{{ okr.title }}</span>
              <span class="okr-percent" :style="{color: progressColor(okr.progress)}">{{ okr.progress }}%</span>
            </div>
            <div class="okr-bar">
              <div class="okr-fill" :style="{width: okr.progress + '%', background: progressColor(okr.progress)}"></div>
            </div>
          </a>
        </div>
      </section>

      <section class="section" v-if="notionData?.week">
        <div class="section-header">
          <svg class="section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span class="section-title">本周 PDCA</span>
          <div class="section-line"></div>
        </div>
        <div class="pdca-card">
          <div class="pdca-title">{{ notionData.week.title }}</div>
          <div class="pdca-plan">{{ notionData.week.plan }}</div>
          <div class="pdca-score">
            <span class="score-label">自评</span>
            <span class="score-stars">{{ scoreStars(notionData.week.score) }}</span>
            <span class="score-value">{{ notionData.week.score }}分</span>
          </div>
          <a v-if="notionData.week.url" :href="notionData.week.url" target="_blank" class="pdca-link">查看详情 →</a>
        </div>
      </section>
    </div>

    <!-- Knowledge Updates -->
    <section class="section" v-if="notionData?.knowledge?.length">
      <div class="section-header">
        <svg class="section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        <span class="section-title">知识动态</span>
        <div class="section-line"></div>
      </div>
      <div class="knowledge-list">
        <a v-for="item in notionData.knowledge" :key="item.url" :href="item.url" target="_blank" class="knowledge-item">
          <span class="knowledge-tab">{{ item.tab }}</span>
          <span class="knowledge-title">{{ item.title }}</span>
          <span class="knowledge-updated">{{ item.updated }}</span>
        </a>
      </div>
    </section>

    <!-- System Status -->
    <section class="section">
      <div class="section-header">
        <svg class="section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        <span class="section-title">系统状态</span>
        <div class="section-line"></div>
        <span class="section-extra" v-if="sys">运行 {{ fmtUptime(sys.time?.uptime || 0) }}</span>
      </div>
      <div class="metrics-grid" v-if="sys">
        <MetricBar label="CPU" :value="sys.cpu?.usage || 0" unit="%" :detail="`${sys.cpu?.cores || '-'} 核心`" />
        <MetricBar label="内存" :value="sys.memory?.percent || 0" unit="%" :detail="`${fmtBytes(sys.memory?.used)} / ${fmtBytes(sys.memory?.total)}`" />
        <MetricBar label="磁盘" :value="sys.disk?.percent || 0" unit="%" :detail="`${fmtBytes(sys.disk?.used)} / ${fmtBytes(sys.disk?.total)}`" />
        <MetricBar label="Docker" :value="sys.docker?.total ? Math.round(sys.docker.running / sys.docker.total * 100) : 0" unit="%" :detail="`${sys.docker?.running || 0}/${sys.docker?.total || 0} 容器运行`" :color="sys.docker?.running === sys.docker?.total ? '#10b981' : '#f59e0b'" />
      </div>
      <div class="metrics-grid" v-else>
        <div v-for="i in 4" :key="i" class="metric-skeleton">
          <div class="sk-line" style="width:40%"></div>
          <div class="sk-bar"></div>
        </div>
      </div>
    </section>

    <!-- Self-hosted Services -->
    <section class="section">
      <div class="section-header">
        <svg class="section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1"/><circle cx="6" cy="18" r="1"/></svg>
        <span class="section-title">自托管服务</span>
        <div class="section-line"></div>
      </div>
      <div class="service-grid">
        <a v-for="s in services" :key="s.id" :href="s.url" target="_blank" class="service-link" :title="s.hint || ''">
          <span class="svc-emoji">{{ s.icon }}</span>
          <div class="svc-info">
            <span class="svc-name">{{ s.name }}</span>
            <span class="svc-desc">{{ s.hint || s.desc }}</span>
          </div>
          <svg class="svc-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
        </a>
      </div>
    </section>

    <!-- Bookmarks -->
    <section class="section">
      <div class="section-header">
        <svg class="section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        <span class="section-title">常用工具</span>
        <div class="section-line"></div>
      </div>
      <div class="bookmark-grid">
        <a v-for="b in bookmarks" :key="b.name" :href="b.url" target="_blank" class="bookmark">
          <span class="bm-emoji">{{ b.icon }}</span>
          <span class="bm-name">{{ b.name }}</span>
        </a>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Hero */
.hero { padding: 40px 0 28px; }
.hero-title { font-size: 40px; font-weight: 510; line-height: 1.1; letter-spacing: -0.88px; color: var(--text-primary); margin-bottom: 4px; }
.hero-date { font-size: 15px; color: var(--text-tertiary); letter-spacing: -0.165px; }

/* Search */
.search-box {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle);
  border-radius: 8px; padding: 8px 14px; max-width: 480px;
  transition: all 0.2s ease; margin-bottom: 8px;
}
.search-box.focused { border-color: rgba(113,112,255,0.3); background: rgba(255,255,255,0.05); box-shadow: 0 0 0 3px rgba(113,112,255,0.08); }
.search-icon { color: var(--text-quaternary); flex-shrink: 0; }
.search-input { flex: 1; background: none; border: none; outline: none; font-family: var(--font-sans); font-size: 13px; color: var(--text-primary); }
.search-input::placeholder { color: var(--text-quaternary); }
.search-kbd { font-family: var(--font-mono); font-size: 11px; color: var(--text-quaternary); padding: 1px 5px; background: rgba(255,255,255,0.04); border: 1px solid var(--border-subtle); border-radius: 4px; flex-shrink: 0; }

/* Search Results */
.search-results { background: var(--bg-surface); border: 1px solid var(--border-standard); border-radius: 12px; padding: 12px; margin-bottom: 24px; }
.sr-group { margin-bottom: 8px; }
.sr-group:last-child { margin-bottom: 0; }
.sr-label { font-size: 10px; font-weight: 510; color: var(--text-quaternary); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
.sr-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; text-decoration: none; color: var(--text-secondary); font-size: 13px; transition: background 0.15s; }
.sr-item:hover { background: rgba(255,255,255,0.04); color: var(--text-primary); }
.sr-emoji { font-size: 16px; }
.sr-name { font-weight: 510; }
.sr-domain { font-family: var(--font-mono); font-size: 11px; color: var(--text-quaternary); margin-left: auto; }

/* Section */
.section { margin-bottom: 40px; }
.section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.section-icon { color: var(--text-quaternary); flex-shrink: 0; }
.section-title { font-size: 12px; font-weight: 510; letter-spacing: -0.15px; color: var(--text-quaternary); text-transform: uppercase; flex-shrink: 0; }
.section-line { flex: 1; height: 1px; background: var(--border-subtle); }
.section-extra { font-size: 11px; font-family: var(--font-mono); color: var(--text-quaternary); flex-shrink: 0; }
.section-badge { font-size: 10px; font-weight: 510; color: var(--accent); padding: 2px 8px; background: rgba(113,112,255,0.08); border: 1px solid rgba(113,112,255,0.15); border-radius: 9999px; flex-shrink: 0; }

/* Today Overview */
.today-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
.today-stat { display: flex; flex-direction: column; align-items: center; padding: 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 8px; }
.ts-value { font-size: 24px; font-weight: 510; color: var(--text-primary); }
.ts-label { font-size: 11px; color: var(--text-quaternary); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }
.todo-list { display: flex; flex-direction: column; gap: 6px; }
.todo-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: rgba(255,255,255,0.015); border: 1px solid var(--border-subtle); border-radius: 6px; text-decoration: none; transition: all 0.15s; }
.todo-item:hover { background: rgba(255,255,255,0.03); border-color: var(--border-standard); }
.todo-priority { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.todo-text { flex: 1; font-size: 13px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.todo-item:hover .todo-text { color: var(--text-primary); }

/* Split Row */
.split-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 40px; }
.split-row > .section { margin-bottom: 0; }

/* OKR List */
.okr-list { display: flex; flex-direction: column; gap: 12px; }
.okr-item { display: block; padding: 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 8px; text-decoration: none; transition: all 0.15s; }
.okr-item:hover { background: rgba(255,255,255,0.04); border-color: var(--border-standard); }
.okr-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.okr-title { font-size: 13px; font-weight: 500; color: var(--text-secondary); }
.okr-item:hover .okr-title { color: var(--text-primary); }
.okr-percent { font-family: var(--font-mono); font-size: 12px; font-weight: 510; }
.okr-bar { height: 4px; background: rgba(255,255,255,0.04); border-radius: 2px; overflow: hidden; }
.okr-fill { height: 100%; border-radius: 2px; transition: width 0.3s ease; }

/* PDCA Card */
.pdca-card { padding: 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 8px; }
.pdca-title { font-size: 15px; font-weight: 510; color: var(--text-primary); margin-bottom: 8px; }
.pdca-plan { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px; }
.pdca-score { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.score-label { font-size: 11px; color: var(--text-quaternary); text-transform: uppercase; }
.score-stars { font-size: 16px; color: var(--accent); }
.score-value { font-family: var(--font-mono); font-size: 12px; color: var(--text-secondary); margin-left: auto; }
.pdca-link { font-size: 12px; color: var(--accent); text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
.pdca-link:hover { text-decoration: underline; }

/* Knowledge List */
.knowledge-list { display: flex; flex-direction: column; gap: 6px; }
.knowledge-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: rgba(255,255,255,0.015); border: 1px solid var(--border-subtle); border-radius: 6px; text-decoration: none; transition: all 0.15s; }
.knowledge-item:hover { background: rgba(255,255,255,0.03); border-color: var(--border-standard); }
.knowledge-tab { font-size: 10px; font-weight: 510; color: var(--text-quaternary); text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 6px; background: rgba(255,255,255,0.04); border-radius: 4px; flex-shrink: 0; }
.knowledge-title { flex: 1; font-size: 13px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.knowledge-item:hover .knowledge-title { color: var(--text-primary); }
.knowledge-updated { font-family: var(--font-mono); font-size: 11px; color: var(--text-quaternary); flex-shrink: 0; }

/* Metrics */
.metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.metric-skeleton { }
.sk-line { height: 10px; background: rgba(255,255,255,0.04); border-radius: 2px; margin-bottom: 8px; }
.sk-bar { height: 4px; background: rgba(255,255,255,0.03); border-radius: 2px; }

/* Card Grid */
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }

/* Services */
.service-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
.service-link {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; background: rgba(255,255,255,0.02);
  border: 1px solid var(--border-subtle); border-radius: 8px;
  text-decoration: none; transition: all 0.15s ease;
}
.service-link:hover { background: rgba(255,255,255,0.05); border-color: var(--border-standard); }
.svc-emoji { font-size: 22px; flex-shrink: 0; }
.svc-info { flex: 1; min-width: 0; }
.svc-name { display: block; font-size: 13px; font-weight: 510; color: var(--text-secondary); }
.service-link:hover .svc-name { color: var(--text-primary); }
.svc-desc { display: block; font-size: 11px; color: var(--text-quaternary); margin-top: 2px; }
.svc-arrow { color: var(--text-quaternary); flex-shrink: 0; transition: color 0.15s; }
.service-link:hover .svc-arrow { color: var(--accent); }

/* Bookmarks */
.bookmark-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; }
.bookmark { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 8px; text-decoration: none; color: var(--text-secondary); font-size: 13px; font-weight: 500; transition: all 0.15s ease; }
.bookmark:hover { background: rgba(255,255,255,0.05); border-color: var(--border-standard); color: var(--text-primary); }
.bm-emoji { font-size: 18px; }
.bm-name { font-size: 13px; }

/* Responsive */
@media (max-width: 768px) {
  .hero-title { font-size: 28px; letter-spacing: -0.6px; }
  .metrics-grid { grid-template-columns: 1fr 1fr; }
  .card-grid { grid-template-columns: 1fr 1fr; }
  .today-grid { grid-template-columns: 1fr 1fr 1fr; }
  .split-row { grid-template-columns: 1fr; }
  .search-kbd { display: none; }
}
@media (max-width: 480px) {
  .card-grid { grid-template-columns: 1fr; }
  .bookmark-grid { grid-template-columns: 1fr 1fr; }
  .metrics-grid { grid-template-columns: 1fr; }
  .today-grid { grid-template-columns: 1fr; }
}
</style>
