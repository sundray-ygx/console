<script setup lang="ts">
defineProps<{ icon?: string; text?: string; sub?: string }>()
</script>

<template>
  <div class="empty">
    <span v-if="icon" class="empty-icon">{{ icon }}</span>
    <p class="empty-text">{{ text || '暂无数据' }}</p>
    <p v-if="sub" class="empty-sub">{{ sub }}</p>
  </div>
</template>

<style scoped>
.empty { text-align: center; padding: 40px 20px; }
.empty-icon { font-size: 36px; display: block; margin-bottom: 12px; }
.empty-text { font-size: 14px; font-weight: 510; color: var(--text-secondary); margin-bottom: 4px; }
.empty-sub { font-size: 12px; color: var(--text-quaternary); }
</style>
