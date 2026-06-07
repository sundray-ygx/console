<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAreas } from '../composables/useAreas'

const router = useRouter()
const { areas, loading, error, fetchAreas } = useAreas()

function handleChildClick(child: { id: string; type: string }) {
  if (child.type === 'course') {
    router.push(`/learn?course=${encodeURIComponent(child.id)}`)
  }
}

onMounted(() => {
  fetchAreas()
})
</script>

<template>
  <div class="areas">
    <h1 class="page-title" style="margin-bottom:4px">Areas</h1>
    <p class="page-subtitle" style="font-size:14px;color:var(--text-tertiary);margin-bottom:24px">
      Life responsibilities grouped by domain — each area contains related resources and courses
    </p>

    <div v-if="loading && areas.length === 0" class="loading-state">
      <span class="loading-spinner">⟳</span>
      <p>Loading areas...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{{ error }}</p>
    </div>
    <div v-else-if="areas.length === 0" class="empty-state">
      <span class="empty-icon">📂</span>
      <p>No areas yet</p>
    </div>
    <div v-else class="areas-grid">
      <div v-for="area in areas" :key="area.id" class="area-card">
        <div class="area-header">
          <span class="area-icon">{{ area.icon }}</span>
          <div class="area-meta">
            <h2 class="area-name">{{ area.name }}</h2>
            <span class="area-source">{{ area.source }}</span>
          </div>
          <span class="area-count">{{ area.itemCount }}</span>
        </div>
        <div v-if="area.children.length > 0" class="area-children">
          <div
            v-for="child in area.children"
            :key="child.id"
            class="child-item"
            @click="handleChildClick(child)"
          >
            <span class="child-type">{{ child.type }}</span>
            <span class="child-name">{{ child.name }}</span>
            <span class="child-count">{{ child.count }}</span>
          </div>
        </div>
        <div v-else class="area-empty">
          <span>No linked resources</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.areas { padding-top: 32px; }
.loading-state, .error-state, .empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 60px 20px; color: var(--text-tertiary);
}
.loading-spinner { font-size: 32px; animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.error-icon, .empty-icon { font-size: 32px; }

.areas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
.area-card { border: 1px solid var(--border-subtle); border-radius: 12px; background: var(--bg-surface); overflow: hidden; }
.area-header { display: flex; align-items: center; gap: 12px; padding: 16px; border-bottom: 1px solid var(--border-subtle); }
.area-icon { font-size: 24px; }
.area-meta { flex: 1; min-width: 0; }
.area-name { font-size: 16px; font-weight: 510; color: var(--text-primary); margin: 0; }
.area-source { font-size: 11px; color: var(--text-quaternary); font-family: var(--font-mono); }
.area-count { font-size: 14px; font-family: var(--font-mono); color: var(--text-quaternary); background: var(--bg-canvas); padding: 2px 8px; border-radius: 6px; }
.area-children { padding: 10px; display: flex; flex-direction: column; gap: 6px; }
.child-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 8px;
  background: var(--bg-panel); border: 1px solid var(--border-subtle);
  cursor: pointer; transition: all 0.12s;
}
.child-item:hover { border-color: var(--border-standard); background: var(--bg-canvas); }
.child-type { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); flex-shrink: 0; }
.child-name { flex: 1; font-size: 13px; color: var(--text-secondary); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.child-count { font-size: 11px; font-family: var(--font-mono); color: var(--text-quaternary); }
.area-empty { padding: 20px; text-align: center; font-size: 12px; color: var(--text-quaternary); }

@media (max-width: 768px) { .areas-grid { grid-template-columns: 1fr; } }
</style>
