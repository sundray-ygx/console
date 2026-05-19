<script setup lang="ts">
const emit = defineEmits<{ (e: 'retry'): void }>()
</script>

<template>
  <div class="widget-error">
    <span class="we-icon">⚠</span>
    <span class="we-text">数据加载失败</span>
    <button class="we-btn" @click="emit('retry')">重试</button>
  </div>
</template>

<style scoped>
.widget-error { display: flex; align-items: center; gap: 8px; padding: 16px; color: var(--text-quaternary); font-size: 13px; }
.we-icon { font-size: 16px; }
.we-btn {
  margin-left: auto; padding: 4px 12px; border-radius: 6px;
  border: 1px solid var(--border-standard); background: rgba(255,255,255,0.04);
  color: var(--text-secondary); font-size: 12px; cursor: pointer;
}
.we-btn:hover { background: rgba(255,255,255,0.08); }
</style>
