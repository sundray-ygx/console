<script setup lang="ts">
const props = defineProps<{
  percent: number
  size?: number
  stroke?: number
}>()

const sz = props.size ?? 28
const sw = props.stroke ?? 3
const r = (sz - sw) / 2
const c = 2 * Math.PI * r
const offset = c - (Math.min(props.percent, 100) / 100) * c
</script>

<template>
  <svg :width="sz" :height="sz" class="progress-ring" viewBox="0 0 28 28">
    <circle :cx="sz/2" :cy="sz/2" :r="r" fill="none" stroke-width="3"
      stroke="var(--border-standard)" />
    <circle :cx="sz/2" :cy="sz/2" :r="r" fill="none" stroke-width="3"
      stroke="var(--accent)" stroke-linecap="round"
      :stroke-dasharray="87.96" :stroke-dashoffset="offset"
      :style="{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }" />
  </svg>
</template>

<style scoped>
.progress-ring { display: inline-block; vertical-align: middle; flex-shrink: 0; }
</style>
