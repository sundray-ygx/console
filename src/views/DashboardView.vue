<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { bookmarks, services } from '../config/services'
import MetricBar from '../components/MetricBar.vue'
import { useSystem } from '../composables/useSystem'
import { useNotion } from '../composables/useNotion'

const router = useRouter()
const { data: sys } = useSystem(10000)
const { fetchToday, fetchOkr, fetchWeek, fetchKnowledge } = useNotion()

const searchQuery = ref('')
const searchFocused = ref(false)
const now = ref(new Date())

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

// ── Widget data ──
const todayData = ref<any>(null)
const okrData = ref<any>(null)
const weekData = ref<any>(null)
const knowledgeData = ref<any>(null)
const learnDashboard = ref<any>(null)
const learnReviews = ref<any>(null)

async function loadWidgets() {
  const [t, o, w, k, ld, lr] = await Promise.all([
    fetchToday().catch(() => null),
    fetchOkr('进行中').catch(() => null),
    fetchWeek().catch(() => null),
    fetchKnowledge().catch(() => null),
    fetch('/api/learn/dashboard').then(r => r.json()).catch(() => null),
    fetch('/api/learn/reviews/due').then(r => r.json()).catch(() => null),
  ])
  todayData.value = t
  okrData.value = o
  weekData.value = w
  knowledgeData.value = k
  learnDashboard.value = ld
  learnReviews.value = lr
}

function progressColor(pct: number): string {
  if (pct >= 80) return '#10b981'
  if (pct >= 50) return '#7170ff'
  return '#f59e0b'
}
function scoreStars(score: number): string {
  const full = Math.floor(score / 20)
  const half = score % 20 >= 10
  return '★'.repeat(full) + (half ? '½' : '')
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

function go(path: string) { router.push(path) }

let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  tick()
  loadWidgets()
  timer = setInterval(tick, 1000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="dashboard">
    <!-- Hero -->
    <section class="hero">
      <h1 class="hero-title">{{ greeting }}，Boss</h1>
      <p class="hero-date">{{ dateStr }}</p>
    </section>

    <!-- Search -->
    <div class="search-box" :class="{ focused: searchFocused }">
      <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      <input v-model="searchQuery" @focus="searchFocused = true" @blur="searchFocused = false" placeholder="搜索服务或工具..." class="search-input" />
      <kbd class="search-kbd">/</kbd>
    </div>
    <section v-if="filteredBookmarks?.length" class="search-results">
      <div class="sr-group">
        <span class="sr-label">工具</span>
        <a v-for="b in filteredBookmarks" :key="b.name" :href="b.url" target="_blank" class="sr-item">
          <span class="sr-emoji">{{ b.icon }}</span>
          <span class="sr-name">{{ b.name }}</span>
        </a>
      </div>
    </section>

    <!-- ═══ Quick Summary — Today + OKR + PDCA ═══ -->
    <div class="summary-row">
      <!-- Today Overview -->
      <section class="section summary-card" v-if="todayData" @click="go('/today')">
        <div class="section-header">
          <svg class="section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span class="section-title">Today</span>
          <div class="section-line"></div>
          <span class="section-extra" v-if="todayData.stats">{{ todayData.stats.pendingTodos }}待办</span>
        </div>
        <div class="stat-row">
          <div class="stat-item"><span class="stat-val">{{ todayData.stats?.pendingTodos ?? '-' }}</span><span class="stat-lbl">待办</span></div>
          <div class="stat-item"><span class="stat-val">{{ todayData.stats?.activeTasks ?? '-' }}</span><span class="stat-lbl">任务</span></div>
          <div class="stat-item"><span class="stat-val">{{ todayData.stats?.habitRate ?? '-' }}%</span><span class="stat-lbl">习惯</span></div>
          <div class="stat-item"><span class="stat-val">{{ todayData.stats?.completedTodos ?? '-' }}</span><span class="stat-lbl">完成</span></div>
        </div>
      </section>

      <!-- OKR Progress -->
      <section class="section summary-card" v-if="okrData?.domains" @click="go('/okr')">
        <div class="section-header">
          <svg class="section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <span class="section-title">OKR Progress</span>
          <div class="section-line"></div>
          <span class="section-extra">{{ okrData.domains.length }} domains</span>
        </div>
        <div class="okr-mini-list">
          <div v-for="d in okrData.domains.slice(0, 3)" :key="d.id" class="okr-mini">
            <span class="okr-mini-label">{{ d.name }}</span>
            <div class="okr-mini-bar-wrap">
              <div class="okr-mini-bar" :style="{ width: Math.round(d.objectives.reduce((s:number,o:any)=>s+(o.krs||[]).reduce((ks:number,kr:any)=>ks+(kr.score||kr.progress||0),0)/Math.max((o.krs||[]).length,1),0)/Math.max(d.objectives.length,1)) + '%', background: progressColor(Math.round(d.objectives.reduce((s:number,o:any)=>s+(o.krs||[]).reduce((ks:number,kr:any)=>ks+(kr.score||kr.progress||0),0)/Math.max((o.krs||[]).length,1),0)/Math.max(d.objectives.length,1))) }"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- PDCA Week -->
      <section class="section summary-card" v-if="weekData" @click="go('/pdca')">
        <div class="section-header">
          <svg class="section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span class="section-title">This Week</span>
          <div class="section-line"></div>
        </div>
        <div class="pdca-mini">
          <div class="pdca-mini-title">{{ weekData.title || weekData.week?.title || '本周' }}</div>
          <div class="pdca-mini-score" v-if="weekData.score || weekData.week?.score">
            <span class="score-stars">{{ scoreStars(weekData.score || weekData.week?.score) }}</span>
            <span class="score-num">{{ weekData.score || weekData.week?.score }}分</span>
          </div>
          <div class="pdca-mini-plan">{{ (weekData.plan || weekData.week?.plan || '').slice(0, 80) }}</div>
        </div>
      </section>
    </div>

    <!-- ═══ Knowledge + Learn ═══ -->
    <div class="summary-row">
      <!-- Knowledge Widget -->
      <section class="section summary-card" v-if="knowledgeData?.recent" @click="go('/knowledge')">
        <div class="section-header">
          <svg class="section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          <span class="section-title">Knowledge</span>
          <div class="section-line"></div>
        </div>
        <div class="kmini-list">
          <div v-for="(items, lib) in knowledgeData.recent" :key="lib" class="kmini-group" v-if="items?.length">
            <span class="kmini-tab">{{ {library:'📚',material:'📎',inspiration:'💡',treasure:'💎'}[lib] || '📄' }} {{ lib }}</span>
            <span class="kmini-item">{{ items[0].title?.slice(0, 36) || '' }}</span>
          </div>
        </div>
      </section>

      <!-- Learn Widget -->
      <section class="section summary-card" @click="go('/learn')" style="cursor:pointer">
        <div class="section-header">
          <svg class="section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/></svg>
          <span class="section-title">Learning</span>
          <div class="section-line"></div>
          <span class="section-extra" v-if="learnReviews?.total">{{ learnReviews.total }} due</span>
        </div>
        <div class="lmini-grid">
          <div class="lmini-stat"><span class="lmini-num">{{ learnDashboard?.total_courses ?? '-' }}</span><span class="lmini-lbl">courses</span></div>
          <div class="lmini-stat"><span class="lmini-num">{{ learnDashboard?.overall_percent ?? 0 }}%</span><span class="lmini-lbl">progress</span></div>
          <div class="lmini-stat"><span class="lmini-num">{{ learnReviews?.total ?? 0 }}</span><span class="lmini-lbl">reviews</span></div>
          <div class="lmini-stat"><span class="lmini-num">{{ learnDashboard?.total_read ?? 0 }}</span><span class="lmini-lbl">read</span></div>
        </div>
      </section>

      <!-- Streak stat from learn -->
      <section class="section summary-card streak-card" @click="go('/learn')" style="cursor:pointer">
        <div class="section-header">
          <svg class="section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <span class="section-title">Streak</span>
          <div class="section-line"></div>
        </div>
        <div class="streak-big">—</div>
      </section>
    </div>

    <!-- System Status -->
    <section class="section">
      <div class="section-header">
        <svg class="section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        <span class="section-title">System</span>
        <div class="section-line"></div>
        <span class="section-extra" v-if="sys">运行 {{ fmtUptime(sys.time?.uptime || 0) }}</span>
      </div>
      <div class="metrics-grid" v-if="sys">
        <MetricBar label="CPU" :value="sys.cpu?.usage || 0" unit="%" :detail="`${sys.cpu?.cores || '-'} 核心`" />
        <MetricBar label="RAM" :value="sys.memory?.percent || 0" unit="%" :detail="`${fmtBytes(sys.memory?.used)} / ${fmtBytes(sys.memory?.total)}`" />
        <MetricBar label="DISK" :value="sys.disk?.percent || 0" unit="%" :detail="`${fmtBytes(sys.disk?.used)} / ${fmtBytes(sys.disk?.total)}`" />
        <MetricBar label="Docker" :value="sys.docker?.total ? Math.round(sys.docker.running / sys.docker.total * 100) : 0" unit="%" :detail="`${sys.docker?.running || 0}/${sys.docker?.total || 0}`" :color="sys.docker?.running === sys.docker?.total ? '#10b981' : '#f59e0b'" />
      </div>
      <div class="metrics-grid" v-else>
        <div v-for="i in 4" :key="i" class="metric-skeleton"><div class="sk-line" style="width:40%"></div><div class="sk-bar"></div></div>
      </div>
    </section>

    <!-- Self-hosted Services -->
    <section class="section">
      <div class="section-header">
        <svg class="section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1"/><circle cx="6" cy="18" r="1"/></svg>
        <span class="section-title">Services</span>
        <div class="section-line"></div>
      </div>
      <div class="service-grid">
        <a v-for="s in services" :key="s.id" :href="s.url" target="_blank" class="service-link" :title="s.hint || ''">
          <span class="svc-emoji">{{ s.icon }}</span>
          <div class="svc-info"><span class="svc-name">{{ s.name }}</span><span class="svc-desc">{{ s.hint || s.desc }}</span></div>
          <svg class="svc-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
        </a>
      </div>
    </section>

    <!-- Bookmarks -->
    <section class="section">
      <div class="section-header">
        <svg class="section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        <span class="section-title">Bookmarks</span>
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
.hero { padding: 40px 0 28px; }
.hero-title { font-size: 40px; font-weight: 510; line-height: 1.1; letter-spacing: -0.88px; color: var(--text-primary); margin-bottom: 4px; }
.hero-date { font-size: 15px; color: var(--text-tertiary); letter-spacing: -0.165px; }
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
.search-results { background: var(--bg-surface); border: 1px solid var(--border-standard); border-radius: 12px; padding: 12px; margin-bottom: 24px; }
.sr-label { font-size: 10px; font-weight: 510; color: var(--text-quaternary); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
.sr-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; text-decoration: none; color: var(--text-secondary); font-size: 13px; transition: background 0.15s; }
.sr-item:hover { background: rgba(255,255,255,0.04); color: var(--text-primary); }
.sr-emoji { font-size: 16px; }
.sr-name { font-weight: 510; }

/* Section common */
.section { margin-bottom: 40px; }
.section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.section-icon { color: var(--text-quaternary); flex-shrink: 0; }
.section-title { font-size: 12px; font-weight: 510; letter-spacing: -0.15px; color: var(--text-quaternary); text-transform: uppercase; flex-shrink: 0; }
.section-line { flex: 1; height: 1px; background: var(--border-subtle); }
.section-extra { font-size: 11px; font-family: var(--font-mono); color: var(--text-quaternary); flex-shrink: 0; }

/* Summary row */
.summary-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 40px; }
.summary-card { margin-bottom: 0 !important; padding: 16px; border: 1px solid var(--border-subtle); border-radius: 12px; background: var(--bg-surface); cursor: pointer; transition: border-color 0.15s, background 0.15s; }
.summary-card:hover { border-color: var(--border-standard); background: var(--bg-panel); }
.summary-card .section-header { margin-bottom: 10px; }
.summary-card .section { margin-bottom: 0 !important; }

/* Stat row (Today) */
.stat-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.stat-item { display: flex; flex-direction: column; align-items: center; padding: 8px; background: rgba(255,255,255,0.02); border-radius: 8px; }
.stat-val { font-size: 20px; font-weight: 510; color: var(--text-primary); font-family: var(--font-mono); }
.stat-lbl { font-size: 10px; color: var(--text-quaternary); margin-top: 2px; text-transform: uppercase; }

/* OKR mini */
.okr-mini-list { display: flex; flex-direction: column; gap: 8px; }
.okr-mini { display: flex; flex-direction: column; gap: 4px; }
.okr-mini-label { font-size: 12px; color: var(--text-secondary); }
.okr-mini-bar-wrap { height: 4px; background: rgba(255,255,255,0.04); border-radius: 2px; overflow: hidden; }
.okr-mini-bar { height: 100%; border-radius: 2px; transition: width 0.3s; }

/* PDCA mini */
.pdca-mini-title { font-size: 13px; font-weight: 510; color: var(--text-primary); margin-bottom: 4px; }
.pdca-mini-score { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.score-stars { font-size: 14px; color: var(--accent); }
.score-num { font-size: 11px; font-family: var(--font-mono); color: var(--text-tertiary); }
.pdca-mini-plan { font-size: 12px; color: var(--text-tertiary); line-height: 1.5; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }

/* Knowledge mini */
.kmini-list { display: flex; flex-direction: column; gap: 8px; }
.kmini-group { display: flex; gap: 8px; align-items: baseline; }
.kmini-tab { font-size: 11px; color: var(--text-quaternary); flex-shrink: 0; }
.kmini-item { font-size: 12px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Learn mini */
.lmini-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.lmini-stat { display: flex; flex-direction: column; align-items: center; padding: 8px; background: rgba(255,255,255,0.02); border-radius: 8px; }
.lmini-num { font-size: 18px; font-weight: 510; color: var(--text-primary); font-family: var(--font-mono); }
.lmini-lbl { font-size: 10px; color: var(--text-quaternary); margin-top: 2px; text-transform: uppercase; }

/* Streak big */
.streak-big { font-size: 36px; font-weight: 510; color: var(--text-primary); text-align: center; padding: 12px 0; font-family: var(--font-mono); }

/* Metrics */
.metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.metric-skeleton { }
.sk-line { height: 10px; background: rgba(255,255,255,0.04); border-radius: 2px; margin-bottom: 8px; }
.sk-bar { height: 4px; background: rgba(255,255,255,0.03); border-radius: 2px; }

/* Services */
.service-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
.service-link { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 8px; text-decoration: none; transition: all 0.15s ease; }
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

@media (max-width: 1200px) { .summary-row { grid-template-columns: 1fr 1fr; } }
@media (max-width: 768px) {
  .hero-title { font-size: 28px; letter-spacing: -0.6px; }
  .summary-row { grid-template-columns: 1fr; }
  .metrics-grid { grid-template-columns: 1fr 1fr; }
  .search-kbd { display: none; }
}
@media (max-width: 480px) {
  .bookmark-grid { grid-template-columns: 1fr 1fr; }
  .metrics-grid { grid-template-columns: 1fr; }
  .stat-row { grid-template-columns: repeat(4, 1fr); gap: 4px; }
}
</style>
