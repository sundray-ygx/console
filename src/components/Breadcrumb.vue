<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const crumbs = computed(() => {
  const bc = route.meta.breadcrumb as { label: string; icon?: string }[] | undefined
  if (bc) {
    // For service routes, dynamically add service name
    if (route.name === 'service') {
      return [
        { label: '服务' },
        { label: route.params.id as string, icon: '🔗' }
      ]
    }
    return bc
  }
  // Fallback from path
  const pathMap: Record<string, string> = {
    '/': '首页', '/today': '今日', '/okr': 'OKR', '/pdca': 'PDCA',
    '/knowledge': 'Notion 知识库', '/kb': 'Hermes 知识库', '/settings': '设置'
  }
  return [{ label: pathMap[route.path] || route.path }]
})
</script>

<template>
  <div class="breadcrumb">
    <template v-for="(crumb, i) in crumbs" :key="i">
      <span v-if="i > 0" class="bc-sep">/</span>
      <span class="bc-item" :class="{ current: i === crumbs.length - 1 }">
        {{ crumb.icon }} {{ crumb.label }}
      </span>
    </template>
  </div>
</template>

<style scoped>
.breadcrumb {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--text-quaternary);
}
.bc-sep { opacity: 0.4; }
.bc-item { letter-spacing: -0.1px; }
.bc-item.current { color: var(--text-tertiary); font-weight: 510; }
</style>
