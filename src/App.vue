<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Breadcrumb from './components/Breadcrumb.vue'

const sidebarExpanded = ref(localStorage.getItem('console-sidebar') !== 'false')
const clock = ref('')
const theme = ref(localStorage.getItem('console-theme') || 'dark')

function updateClock() {
  clock.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
}

function toggleSidebar() {
  sidebarExpanded.value = !sidebarExpanded.value
  localStorage.setItem('console-sidebar', String(sidebarExpanded.value))
}

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

function applyTheme(t: string) {
  if (t === 'light') {
    document.documentElement.setAttribute('data-theme', 'light')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
  localStorage.setItem('console-theme', t)
}

watch(theme, (t) => applyTheme(t))

let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  applyTheme(theme.value)
  updateClock()
  timer = setInterval(updateClock, 1000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<template>
  <div class="app-layout">
    <!-- Ambient -->
    <div class="ambient">
      <div class="orb orb--1"></div>
      <div class="orb orb--2"></div>
    </div>

    <!-- Sidebar -->
    <div class="sidebar-area" :class="sidebarExpanded ? 'expanded' : 'collapsed'">
      <Sidebar :expanded="sidebarExpanded" @toggle="toggleSidebar" />
    </div>

    <!-- Main Content -->
    <div class="main-area" :class="sidebarExpanded ? 'shifted' : 'unshifted'">
      <!-- Header bar -->
      <header class="top-bar">
        <Breadcrumb />
        <div style="flex:1"></div>
        <span class="top-clock">{{ clock }}</span>
        <button class="theme-toggle" @click="toggleTheme" :title="theme === 'dark' ? '切换浅色' : '切换深色'">
          {{ theme === 'dark' ? '☀️' : '🌙' }}
        </button>
      </header>

      <!-- Router View -->
      <main class="view-main">
        <router-view />
      </main>

      <!-- Footer -->
      <footer class="footer">
        <span>© 2026 ygxpro.online · 个人数字中心</span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.top-bar {
  position: sticky; top: 0; z-index: 100;
  display: flex; align-items: center; gap: 16px;
  padding: 0 32px; height: 48px; min-height: 48px;
  background: color-mix(in srgb, var(--bg-canvas) 80%, transparent);
  backdrop-filter: blur(16px) saturate(1.2);
  border-bottom: 1px solid var(--border-subtle);
}
.top-clock {
  font-size: 13px; font-family: var(--font-mono); color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}
.theme-toggle {
  background: none; border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg); padding: 4px 8px;
  cursor: pointer; font-size: 16px; line-height: 1;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s ease;
}
.theme-toggle:hover {
  background: var(--hover-bg);
}
.view-main {
  flex: 1; padding: 0 32px 60px; width: 100%; max-width: 1200px;
}
.footer {
  border-top: 1px solid var(--border-subtle);
  padding: 20px 32px; text-align: center;
  font-size: 12px; color: var(--text-quaternary);
}
</style>
