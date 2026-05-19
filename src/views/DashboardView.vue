<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { API_BASE, services, bookmarks } from '../config/services'
import MetricBar from '../components/MetricBar.vue'
import ServiceCard from '../components/ServiceCard.vue'

// ── State ──
const sys = ref<any>(null)
const healthMap = ref<Record<string, any>>({})
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

const filteredServices = computed(() => {
  if (!searchQuery.value.trim()) return null
  const q = searchQuery.value.toLowerCase()
  return services.filter(s => s.name.toLowerCase().includes(q) || s.desc.includes(q) || s.domain.includes(q))
})
const filteredBookmarks = computed(() => {
  if (!searchQuery.value.trim()) return null
  const q = searchQuery.value.toLowerCase()
  return bookmarks.filter(b => b.name.toLowerCase().includes(q))
})

// ── Data fetching ──
async function fetchSystem() {
  try {
    const res = await fetch(`${API_BASE}/api/system`)
    sys.value = await res.json()
  } catch {}
}
async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`)
    const data = await res.json()
    const map: Record<string, any> = {}
    data.forEach((s: any) => { map[s.id] = s })
    healthMap.value = map
  } catch {}
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

let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  tick(); fetchSystem(); fetchHealth()
  timer = setInterval(() => { tick(); fetchSystem(); fetchHealth() }, 10000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })

const coreServices = services.filter(s => s.category === 'core')
const storageServices = services.filter(s => s.category === 'storage')
const toolServices = services.filter(s => s.category === 'tools')
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
    <section v-if="filteredServices?.length || filteredBookmarks?.length" class="search-results">
      <div v-if="filteredServices?.length" class="sr-group">
        <span class="sr-label">服务</span>
        <a v-for="s in filteredServices" :key="s.id" :href="s.url" target="_blank" class="sr-item">
          <span class="sr-name">{{ s.name }}</span>
          <span class="sr-domain">{{ s.domain }}</span>
        </a>
      </div>
      <div v-if="filteredBookmarks?.length" class="sr-group">
        <span class="sr-label">工具</span>
        <a v-for="b in filteredBookmarks" :key="b.name" :href="b.url" target="_blank" class="sr-item">
          <span class="sr-emoji">{{ b.icon }}</span>
          <span class="sr-name">{{ b.name }}</span>
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

    <!-- Core Services -->
    <section class="section">
      <div class="section-header">
        <svg class="section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span class="section-title">核心服务</span>
        <div class="section-line"></div>
      </div>
      <div class="card-grid">
        <ServiceCard v-for="s in coreServices" :key="s.id" :service="s" :health="healthMap[s.id] || null" />
      </div>
    </section>

    <!-- Storage Services -->
    <section class="section">
      <div class="section-header">
        <svg class="section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <span class="section-title">存储服务</span>
        <div class="section-line"></div>
      </div>
      <div class="card-grid">
        <ServiceCard v-for="s in storageServices" :key="s.id" :service="s" :health="healthMap[s.id] || null" />
      </div>
    </section>

    <!-- Tools -->
    <section class="section" v-if="toolServices.length">
      <div class="section-header">
        <svg class="section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        <span class="section-title">工具</span>
        <div class="section-line"></div>
      </div>
      <div class="card-grid">
        <ServiceCard v-for="s in toolServices" :key="s.id" :service="s" :health="healthMap[s.id] || null" />
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

    <!-- OKR & PDCA placeholders -->
    <section class="section">
      <div class="section-header">
        <svg class="section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
        <span class="section-title">工作管理</span>
        <div class="section-line"></div>
        <span class="section-badge">即将推出</span>
      </div>
      <div class="placeholder-grid">
        <div class="placeholder-card">
          <div class="ph-title">OKR 进度</div>
          <div class="ph-desc">当季目标与关键结果</div>
          <div class="ph-bars">
            <div class="ph-bar"><div class="ph-fill" style="width:60%"></div></div>
            <div class="ph-bar"><div class="ph-fill" style="width:80%"></div></div>
            <div class="ph-bar"><div class="ph-fill" style="width:45%"></div></div>
          </div>
        </div>
        <div class="placeholder-card">
          <div class="ph-title">本周 PDCA</div>
          <div class="ph-desc">计划 · 执行 · 检查 · 改进</div>
          <div class="ph-tasks">
            <div class="ph-task done"></div>
            <div class="ph-task done"></div>
            <div class="ph-task"></div>
            <div class="ph-task"></div>
          </div>
        </div>
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

/* Metrics */
.metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.metric-skeleton { }
.sk-line { height: 10px; background: rgba(255,255,255,0.04); border-radius: 2px; margin-bottom: 8px; }
.sk-bar { height: 4px; background: rgba(255,255,255,0.03); border-radius: 2px; }

/* Card Grid */
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }

/* Bookmarks */
.bookmark-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; }
.bookmark { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 8px; text-decoration: none; color: var(--text-secondary); font-size: 13px; font-weight: 500; transition: all 0.15s ease; }
.bookmark:hover { background: rgba(255,255,255,0.05); border-color: var(--border-standard); color: var(--text-primary); }
.bm-emoji { font-size: 18px; }
.bm-name { font-size: 13px; }

/* Placeholder */
.placeholder-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.placeholder-card { padding: 20px; background: rgba(255,255,255,0.015); border: 1px dashed var(--border-standard); border-radius: 12px; }
.ph-title { font-size: 15px; font-weight: 510; color: var(--text-secondary); margin-bottom: 4px; }
.ph-desc { font-size: 12px; color: var(--text-quaternary); margin-bottom: 16px; }
.ph-bars { display: flex; flex-direction: column; gap: 8px; }
.ph-bar { height: 6px; background: rgba(255,255,255,0.04); border-radius: 3px; overflow: hidden; }
.ph-fill { height: 100%; background: rgba(113,112,255,0.2); border-radius: 3px; }
.ph-tasks { display: flex; gap: 8px; }
.ph-task { flex: 1; height: 32px; background: rgba(255,255,255,0.04); border-radius: 4px; }
.ph-task.done { background: rgba(16,185,129,0.12); }

/* Responsive */
@media (max-width: 768px) {
  .hero-title { font-size: 28px; letter-spacing: -0.6px; }
  .metrics-grid { grid-template-columns: 1fr 1fr; }
  .card-grid { grid-template-columns: 1fr 1fr; }
  .placeholder-grid { grid-template-columns: 1fr; }
  .search-kbd { display: none; }
}
@media (max-width: 480px) {
  .card-grid { grid-template-columns: 1fr; }
  .bookmark-grid { grid-template-columns: 1fr 1fr; }
  .metrics-grid { grid-template-columns: 1fr; }
}
</style>
