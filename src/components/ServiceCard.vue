<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  service: {
    id: string
    name: string
    desc: string
    domain: string
    url: string
    icon: string
    category: string
  }
  health?: { status: string; latency: number } | null
}>()

const iconMap: Record<string, string> = {
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  server: 'M2 2h20v8H2zM2 14h20v8H2zM6 6h.01zM6 18h.01',
  receipt: 'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1ZM8 7h8M8 11h8M8 15h4',
  cloud: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z',
  folder: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
}

const colorMap: Record<string, { bg: string; border: string }> = {
  shield: { bg: 'rgba(113,112,255,0.08)', border: 'rgba(113,112,255,0.12)' },
  server: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.06)' },
  receipt: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.12)' },
  cloud: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.12)' },
  folder: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.06)' },
}

const icon = iconMap[props.service.icon] || iconMap.folder
const colors = colorMap[props.service.icon] || colorMap.folder
const online = props.health?.status === 'online'
</script>

<template>
  <a :href="service.url" target="_blank" rel="noopener" class="card">
    <div class="card-top">
      <div class="card-icon" :style="{ background: colors.bg, border: '1px solid ' + colors.border }">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path v-if="service.icon === 'server'" d="M2 2h20v8H2zM2 14h20v8H2z" /><circle v-if="service.icon === 'server'" cx="6" cy="6" r="1" /><circle v-if="service.icon === 'server'" cx="6" cy="18" r="1" />
          <path :d="icon" v-if="service.icon !== 'server'" />
        </svg>
      </div>
      <span class="status" :class="online ? 'on' : 'off'">
        {{ online ? `${health?.latency}ms` : '离线' }}
      </span>
    </div>
    <div class="card-body">
      <div class="card-name">{{ service.name }}</div>
      <div class="card-desc">{{ service.desc }}</div>
    </div>
    <div class="card-footer">
      <span class="card-domain">{{ service.domain }}</span>
      <svg class="card-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7 17L17 7M17 7H7M17 7v10"/>
      </svg>
    </div>
  </a>
</template>

<style scoped>
.card {
  display: flex; flex-direction: column; gap: 14px; padding: 18px;
  background: rgba(255,255,255,0.02); border: 1px solid var(--border-standard);
  border-radius: 12px; text-decoration: none; color: inherit;
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1); position: relative; overflow: hidden;
}
.card::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse at 50% 0%, rgba(113,112,255,0.06) 0%, transparent 70%);
  opacity: 0; transition: opacity 0.3s ease;
}
.card:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.14); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
.card:hover::before { opacity: 1; }
.card:hover .card-arrow { color: var(--accent); transform: translate(2px,-2px); }

.card-top { display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 1; }
.card-icon { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 8px; color: var(--text-secondary); transition: color 0.2s; }
.card:hover .card-icon { color: var(--accent); }

.status { font-size: 10px; font-family: var(--font-mono); padding: 2px 6px; border-radius: 4px; margin-top: 4px; }
.status.on { color: #10b981; background: rgba(16,185,129,0.1); }
.status.off { color: var(--text-quaternary); background: rgba(255,255,255,0.03); }

.card-body { position: relative; z-index: 1; }
.card-name { font-size: 14px; font-weight: 510; letter-spacing: -0.165px; color: var(--text-primary); margin-bottom: 2px; }
.card-desc { font-size: 12px; color: var(--text-tertiary); letter-spacing: -0.13px; }

.card-footer { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1; padding-top: 12px; border-top: 1px solid var(--border-subtle); }
.card-domain { font-size: 11px; font-family: var(--font-mono); color: var(--text-quaternary); }
.card-arrow { color: var(--text-quaternary); transition: all 0.2s ease; }
</style>
