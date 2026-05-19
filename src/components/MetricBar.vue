<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps<{
  label: string
  value: number
  max?: number
  unit?: string
  detail?: string
  color?: string
}>()

const pct = computed(() => Math.min(100, Math.max(0, props.value)))
const barColor = computed(() => {
  if (props.color) return props.color
  if (pct.value >= 90) return '#ef4444'
  if (pct.value >= 70) return '#f59e0b'
  return '#10b981'
})
</script>

<template>
  <div class="metric">
    <div class="metric-header">
      <span class="metric-label">{{ label }}</span>
      <span class="metric-value">{{ value }}<span class="metric-unit" v-if="unit">{{ unit }}</span></span>
    </div>
    <div class="metric-bar-bg">
      <div class="metric-bar-fill" :style="{ width: pct + '%', background: barColor }"></div>
    </div>
    <div class="metric-detail" v-if="detail">{{ detail }}</div>
  </div>
</template>

<style scoped>
.metric { min-width: 0; }
.metric-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
.metric-label { font-size: 12px; font-weight: 510; color: var(--text-tertiary); letter-spacing: -0.13px; }
.metric-value { font-size: 20px; font-weight: 510; color: var(--text-primary); letter-spacing: -0.24px; font-variant-numeric: tabular-nums; }
.metric-unit { font-size: 12px; color: var(--text-quaternary); margin-left: 1px; }
.metric-bar-bg { height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; }
.metric-bar-fill { height: 100%; border-radius: 2px; transition: width 0.8s cubic-bezier(0.4,0,0.2,1), background 0.3s ease; }
.metric-detail { font-size: 11px; color: var(--text-quaternary); margin-top: 4px; font-family: var(--font-mono); letter-spacing: 0.02em; }
</style>
