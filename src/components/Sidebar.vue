<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { navGroups } from '../config/navigation'

defineProps<{
  expanded: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()

const route = useRoute()

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <aside class="sidebar" :class="{ collapsed: !expanded }">
    <!-- Logo -->
    <div class="sidebar-logo" @click="$router.push('/')">
      <div class="logo-mark">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      </div>
      <span v-if="expanded" class="logo-text">Console</span>
    </div>

    <!-- Nav groups -->
    <nav class="sidebar-nav">
      <div v-for="(group, gi) in navGroups" :key="gi" class="nav-group">
        <div v-if="group.label && expanded" class="nav-group-label">{{ group.label }}</div>
        <router-link
          v-for="item in group.items"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          :title="item.name"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span v-if="expanded" class="nav-name">{{ item.name }}</span>
        </router-link>
      </div>
    </nav>

    <!-- Toggle -->
    <button class="sidebar-toggle" @click="emit('toggle')" :title="expanded ? '收起侧栏' : '展开侧栏'">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path v-if="expanded" d="M15 18l-6-6 6-6"/>
        <path v-else d="M9 18l6-6-6-6"/>
      </svg>
    </button>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 240px; height: 100vh; display: flex; flex-direction: column;
  background: var(--bg-panel); border-right: 1px solid var(--border-subtle);
  transition: width 0.25s cubic-bezier(0.4,0,0.2,1);
  overflow: hidden;
}
.sidebar.collapsed { width: 64px; }

/* Logo */
.sidebar-logo {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 18px; cursor: pointer; flex-shrink: 0;
  border-bottom: 1px solid var(--border-subtle);
}
.logo-mark {
  width: 28px; height: 28px; min-width: 28px; display: flex; align-items: center; justify-content: center;
  background: rgba(113,112,255,0.1); border-radius: 6px; border: 1px solid rgba(113,112,255,0.15);
  color: var(--accent); transition: background 0.15s;
}
.sidebar-logo:hover .logo-mark { background: rgba(113,112,255,0.15); }
.logo-text { font-size: 14px; font-weight: 510; letter-spacing: -0.182px; color: var(--text-primary); white-space: nowrap; }

/* Nav */
.sidebar-nav { flex: 1; overflow-y: auto; padding: 8px; }
.nav-group { margin-bottom: 4px; }
.nav-group-label {
  font-size: 10px; font-weight: 510; color: var(--text-quaternary); text-transform: uppercase;
  letter-spacing: 0.06em; padding: 8px 10px 4px; white-space: nowrap; overflow: hidden;
}
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 10px; border-radius: 8px; text-decoration: none;
  color: var(--text-tertiary); font-size: 13px; font-weight: 450;
  transition: all 0.15s ease; white-space: nowrap; overflow: hidden;
}
.nav-item:hover { background: rgba(255,255,255,0.04); color: var(--text-secondary); }
.nav-item.active { background: rgba(113,112,255,0.1); color: var(--accent); }
.nav-icon { font-size: 16px; min-width: 20px; text-align: center; flex-shrink: 0; }
.nav-name { overflow: hidden; text-overflow: ellipsis; }

/* Collapsed center icons */
.collapsed .nav-item { justify-content: center; padding: 7px; }
.collapsed .sidebar-logo { justify-content: center; padding: 16px; }

/* Toggle */
.sidebar-toggle {
  flex-shrink: 0; margin: 8px; padding: 8px;
  background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle);
  border-radius: 8px; color: var(--text-quaternary); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s ease;
}
.sidebar-toggle:hover { background: rgba(255,255,255,0.06); color: var(--text-secondary); }
</style>
