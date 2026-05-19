<script setup lang="ts">
import { ref, computed } from 'vue'

const activeTab = ref('library')

const topics = ref([
  { id: 1, name: '前端开发', icon: '🎨', count: 42, color: 'rgba(113,112,255,0.1)' },
  { id: 2, name: '后端架构', icon: '⚙️', count: 28, color: 'rgba(16,185,129,0.1)' },
  { id: 3, name: 'DevOps', icon: '🚀', count: 35, color: 'rgba(251,191,36,0.1)' },
  { id: 4, name: '产品设计', icon: '💎', count: 18, color: 'rgba(239,68,68,0.1)' },
  { id: 5, name: '读书笔记', icon: '📚', count: 24, color: 'rgba(168,85,247,0.1)' },
  { id: 6, name: '生活管理', icon: '🏠', count: 15, color: 'rgba(56,189,248,0.1)' },
])

const tabs = [
  { id: 'library', label: '图书馆', icon: '📚' },
  { id: 'materials', label: '资料搜集', icon: '📎' },
  { id: 'inspiration', label: '灵感文档', icon: '💡' },
  { id: 'treasures', label: '宝藏库', icon: '💎' },
]

const items: Record<string, { title: string; category: string; tags: string[]; date: string }[]> = {
  library: [
    { title: 'TypeScript 高级类型体操实战笔记', category: '前端开发', tags: ['TypeScript', '类型系统', '泛型'], date: '2026-05-15' },
    { title: 'Docker Compose 生产环境最佳实践', category: 'DevOps', tags: ['Docker', '容器编排', '生产部署'], date: '2026-05-12' },
    { title: 'Vue 3 Composition API 设计模式', category: '前端开发', tags: ['Vue3', '组合式API', '设计模式'], date: '2026-05-10' },
    { title: 'PostgreSQL 性能调优指南', category: '后端架构', tags: ['数据库', '性能优化', 'SQL'], date: '2026-05-08' },
    { title: 'Nginx 反向代理与负载均衡配置', category: 'DevOps', tags: ['Nginx', '反向代理', '负载均衡'], date: '2026-05-05' },
    { title: '《系统设计面试》读书笔记', category: '读书笔记', tags: ['系统设计', '面试', '架构'], date: '2026-05-01' },
  ],
  materials: [
    { title: 'WebAssembly 入门教程合集', category: '前端开发', tags: ['WASM', '性能', 'Web'], date: '2026-05-14' },
    { title: 'Kubernetes Operator 开发指南', category: 'DevOps', tags: ['K8s', 'Operator', 'Go'], date: '2026-05-11' },
    { title: 'Rust 异步编程 Tokio 实战', category: '后端架构', tags: ['Rust', '异步', 'Tokio'], date: '2026-05-09' },
    { title: 'TailwindCSS v4 新特性整理', category: '前端开发', tags: ['CSS', 'Tailwind', '样式'], date: '2026-05-06' },
  ],
  inspiration: [
    { title: '个人知识管理系统设计方案', category: '产品设计', tags: ['PKM', '知识管理', 'Notion'], date: '2026-05-16' },
    { title: 'Dashboard 可视化灵感收集', category: '产品设计', tags: ['UI', '数据可视化', 'Dashboard'], date: '2026-05-13' },
    { title: '自动化工作流构想', category: '生活管理', tags: ['自动化', '效率', '工作流'], date: '2026-05-07' },
  ],
  treasures: [
    { title: 'Git 高级技巧与工作流', category: 'DevOps', tags: ['Git', '版本控制', '工作流'], date: '2026-04-28' },
    { title: 'Linux 服务器安全加固清单', category: 'DevOps', tags: ['Linux', '安全', '运维'], date: '2026-04-25' },
    { title: 'RESTful API 设计规范', category: '后端架构', tags: ['API', 'REST', '设计规范'], date: '2026-04-20' },
  ],
}

const currentItems = computed(() => items[activeTab.value] || [])
</script>

<template>
  <div class="knowledge">
    <h1 class="page-title">Notion 知识库</h1>
    <p class="page-subtitle">个人知识管理体系 · 收集 · 整理 · 输出</p>

    <!-- Topics Grid -->
    <div class="topics-grid">
      <div v-for="topic in topics" :key="topic.id" class="topic-card" :style="{ background: topic.color }">
        <span class="topic-icon">{{ topic.icon }}</span>
        <span class="topic-name">{{ topic.name }}</span>
        <span class="topic-count">{{ topic.count }} 篇</span>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button v-for="tab in tabs" :key="tab.id" class="tab" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <!-- Content -->
    <div class="items-list">
      <div v-for="item in currentItems" :key="item.title" class="item-row">
        <div class="item-info">
          <span class="item-title">{{ item.title }}</span>
          <div class="item-meta">
            <span class="item-category">{{ item.category }}</span>
            <span class="item-date">{{ item.date }}</span>
          </div>
        </div>
        <div class="item-tags">
          <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.knowledge { padding-top: 32px; }
.page-title { font-size: 28px; font-weight: 510; letter-spacing: -0.6px; color: var(--text-primary); margin-bottom: 4px; }
.page-subtitle { font-size: 14px; color: var(--text-tertiary); margin-bottom: 24px; }

/* Topics */
.topics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px; }
.topic-card {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px; border-radius: 10px;
  border: 1px solid var(--border-subtle); cursor: pointer;
  transition: all 0.15s;
}
.topic-card:hover { border-color: var(--border-standard); transform: translateY(-1px); }
.topic-icon { font-size: 22px; }
.topic-name { font-size: 13px; font-weight: 510; color: var(--text-secondary); flex: 1; }
.topic-count { font-size: 11px; font-family: var(--font-mono); color: var(--text-quaternary); }

/* Tabs */
.tabs { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0; }
.tab {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 16px; background: none; border: none;
  font-size: 13px; color: var(--text-quaternary); cursor: pointer;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
  transition: all 0.15s; font-family: var(--font-sans);
}
.tab:hover { color: var(--text-tertiary); }
.tab.active { color: var(--accent); border-bottom-color: var(--accent); }
.tab-icon { font-size: 14px; }
.tab-label { font-weight: 510; }

/* Items */
.items-list { display: flex; flex-direction: column; gap: 2px; }
.item-row {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 12px 16px; border-radius: 8px; transition: background 0.15s;
}
.item-row:hover { background: rgba(255,255,255,0.03); }
.item-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
.item-title { font-size: 13px; font-weight: 500; color: var(--text-secondary); }
.item-meta { display: flex; align-items: center; gap: 8px; }
.item-category { font-size: 11px; color: var(--accent); }
.item-date { font-size: 11px; font-family: var(--font-mono); color: var(--text-quaternary); }
.item-tags { display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
.tag {
  font-size: 10px; padding: 2px 8px; border-radius: 10px;
  background: rgba(255,255,255,0.04); color: var(--text-quaternary);
  border: 1px solid var(--border-subtle);
}

@media (max-width: 768px) {
  .topics-grid { grid-template-columns: 1fr 1fr; }
  .item-row { flex-direction: column; align-items: flex-start; gap: 8px; }
}
</style>
