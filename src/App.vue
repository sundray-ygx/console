<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Breadcrumb from './components/Breadcrumb.vue'

const sidebarExpanded = ref(true)
const clock = ref('')

function updateClock() {
  clock.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
}

let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
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
      <Sidebar :expanded="sidebarExpanded" @toggle="sidebarExpanded = !sidebarExpanded" />
    </div>

    <!-- Main Content -->
    <div class="main-area" :class="sidebarExpanded ? 'shifted' : 'unshifted'">
      <!-- Header bar -->
      <header class="top-bar">
        <Breadcrumb />
        <div style="flex:1"></div>
        <span class="top-clock">{{ clock }}</span>
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
  background: rgba(8,9,10,0.8); backdrop-filter: blur(16px) saturate(1.2);
  border-bottom: 1px solid var(--border-subtle);
}
.top-clock {
  font-size: 13px; font-family: var(--font-mono); color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
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
