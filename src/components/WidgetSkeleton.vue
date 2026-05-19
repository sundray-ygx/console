<script setup lang="ts">
defineProps<{ lines?: number }>()
</script>

<template>
  <div class="skeleton">
    <div v-for="i in (lines || 3)" :key="i" class="sk-line" :style="{ width: (30 + ((i * 17) % 50)) + '%' }"></div>
  </div>
</template>

<style scoped>
.skeleton { padding: 16px; }
.sk-line {
  height: 12px; border-radius: 6px; margin-bottom: 10px;
  background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { to { background-position: -200% 0; } }
</style>
