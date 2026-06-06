<script setup lang="ts">
import type { LessonMaterial } from '../composables/useCourses'

const props = defineProps<{
  material: LessonMaterial
}>()

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
</script>

<template>
  <a :href="material.url" target="_blank" rel="noopener" class="material-card">
    <div class="mc-main">
      <div class="mc-title">
        <span class="mc-icon">📎</span>
        <span>{{ material.title }}</span>
      </div>
      <div v-if="material.key_points?.length" class="mc-points">
        <span v-for="(p, i) in material.key_points.slice(0, 3)" :key="i" class="mc-point">·{{ p }}</span>
      </div>
      <div class="mc-meta">
        <span v-if="material.relation" class="mc-relation">{{ material.relation }}</span>
        <span v-if="material.url" class="mc-host">{{ hostname(material.url) }} ↗</span>
      </div>
    </div>
  </a>
</template>

<style scoped>
.material-card {
  display: block;
  padding: 12px 14px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  background: var(--bg-panel);
  text-decoration: none;
  transition: border-color 0.15s, background 0.15s, transform 0.15s;
}
.material-card:hover {
  border-color: var(--border-standard);
  background: var(--bg-surface);
}
.material-card:active {
  transform: scale(0.997);
}

.mc-main { display: flex; flex-direction: column; gap: 6px; }

.mc-title {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 13px; line-height: 1.5;
  color: var(--text-primary);
  font-weight: 500;
}
.mc-icon { flex-shrink: 0; font-size: 13px; opacity: 0.8; }

.mc-points {
  display: flex; flex-wrap: wrap; gap: 6px;
  font-size: 11px; color: var(--text-tertiary);
}
.mc-point {
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: var(--bg-canvas);
  font-family: var(--font-mono);
}

.mc-meta {
  display: flex; align-items: center; gap: 8px;
  font-size: 10px; color: var(--text-quaternary);
  font-family: var(--font-mono);
}
.mc-relation {
  padding: 1px 6px; border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  color: var(--accent);
}
.mc-host { margin-left: auto; }
</style>
