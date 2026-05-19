<script setup lang="ts">
import { ref, computed } from 'vue'

// Mock data
const todos = ref([
  { id: 1, title: '完成 Q2 OKR 复盘文档', priority: 'high', done: false },
  { id: 2, title: '审查 PR #127 — 支付模块重构', priority: 'high', done: false },
  { id: 3, title: '更新 NAS 备份策略配置', priority: 'medium', done: false },
  { id: 4, title: '整理 Notion 知识库标签体系', priority: 'low', done: true },
  { id: 5, title: '预约周三团队同步会议', priority: 'medium', done: true },
])

const tasks = ref([
  { id: 1, title: 'Docker Compose 服务迁移', status: 'in-progress', progress: 65 },
  { id: 2, title: 'Dashboard 性能优化', status: 'in-progress', progress: 40 },
  { id: 3, title: 'API 文档编写', status: 'todo', progress: 0 },
  { id: 4, title: 'CI/CD 流水线配置', status: 'done', progress: 100 },
])

const habits = ref([
  { id: 1, name: '晨间冥想', checked: true },
  { id: 2, name: '阅读 30 分钟', checked: true },
  { id: 3, name: '运动锻炼', checked: false },
  { id: 4, name: '英语学习', checked: true },
  { id: 5, name: '日记复盘', checked: false },
  { id: 6, name: '早睡 (23:00)', checked: false },
])

const stats = computed(() => ({
  pendingTodos: todos.value.filter(t => !t.done).length,
  activeTasks: tasks.value.filter(t => t.status === 'in-progress').length,
  completedToday: tasks.value.filter(t => t.status === 'done').length + todos.value.filter(t => t.done).length,
  habitRate: Math.round(habits.value.filter(h => h.checked).length / habits.value.length * 100),
}))

const dayReview = ref('今天完成了 Docker 服务的健康检查集成和 Dashboard 的搜索功能优化。明天计划继续推进 OKR 复盘文档和 API 文档的编写工作。整体进度良好，需要加强运动和早睡习惯的执行。')

function priorityColor(p: string) {
  if (p === 'high') return '#ef4444'
  if (p === 'medium') return '#f59e0b'
  return '#62666d'
}
function statusTag(s: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    'in-progress': { label: '进行中', color: '#7170ff', bg: 'rgba(113,112,255,0.1)' },
    'todo': { label: '待办', color: '#62666d', bg: 'rgba(255,255,255,0.04)' },
    'done': { label: '已完成', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  }
  return map[s] || map['todo']
}
</script>

<template>
  <div class="today">
    <!-- Stats Bar -->
    <div class="stats-bar">
      <div class="stat-card">
        <span class="stat-value">{{ stats.pendingTodos }}</span>
        <span class="stat-label">待办事项</span>
      </div>
      <div class="stat-card">
        <span class="stat-value accent">{{ stats.activeTasks }}</span>
        <span class="stat-label">进行中任务</span>
      </div>
      <div class="stat-card">
        <span class="stat-value green">{{ stats.completedToday }}</span>
        <span class="stat-label">已完成</span>
      </div>
      <div class="stat-card">
        <span class="stat-value" :class="stats.habitRate >= 75 ? 'green' : 'orange'">{{ stats.habitRate }}%</span>
        <span class="stat-label">习惯完成率</span>
      </div>
    </div>

    <div class="two-col">
      <!-- Todo List -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-icon">📝</span>
          <span class="panel-title">待办事项</span>
          <span class="panel-count">{{ stats.pendingTodos }}</span>
        </div>
        <div class="todo-list">
          <div v-for="todo in todos" :key="todo.id" class="todo-item" :class="{ done: todo.done }">
            <div class="todo-check" :class="{ checked: todo.done }">
              <svg v-if="todo.done" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <span class="dot" :style="{ background: todo.done ? 'var(--text-quaternary)' : priorityColor(todo.priority) }"></span>
            <span class="todo-text">{{ todo.title }}</span>
          </div>
        </div>
      </div>

      <!-- Task List -->
      <div class="panel">
        <div class="panel-header">
          <span class="panel-icon">🎯</span>
          <span class="panel-title">任务</span>
          <span class="panel-count">{{ tasks.length }}</span>
        </div>
        <div class="task-list">
          <div v-for="task in tasks" :key="task.id" class="task-item">
            <div class="task-info">
              <span class="task-title">{{ task.title }}</span>
              <span class="task-tag" :style="{ color: statusTag(task.status).color, background: statusTag(task.status).bg }">
                {{ statusTag(task.status).label }}
              </span>
            </div>
            <div class="task-progress">
              <div class="task-bar"><div class="task-fill" :style="{ width: task.progress + '%' }"></div></div>
              <span class="task-pct">{{ task.progress }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Habit Tracker -->
    <div class="panel">
      <div class="panel-header">
        <span class="panel-icon">✅</span>
        <span class="panel-title">今日习惯</span>
        <span class="panel-badge">{{ habits.filter(h => h.checked).length }}/{{ habits.length }}</span>
      </div>
      <div class="habit-grid">
        <div v-for="habit in habits" :key="habit.id" class="habit-item" :class="{ checked: habit.checked }">
          <div class="habit-check">
            <svg v-if="habit.checked" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <span class="habit-name">{{ habit.name }}</span>
        </div>
      </div>
    </div>

    <!-- Day Review -->
    <div class="panel">
      <div class="panel-header">
        <span class="panel-icon">📖</span>
        <span class="panel-title">日复盘</span>
      </div>
      <p class="review-text">{{ dayReview }}</p>
    </div>
  </div>
</template>

<style scoped>
.today { padding-top: 32px; }

/* Stats */
.stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
.stat-card {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 16px; background: rgba(255,255,255,0.02);
  border: 1px solid var(--border-subtle); border-radius: 12px;
}
.stat-value { font-size: 28px; font-weight: 510; color: var(--text-primary); font-variant-numeric: tabular-nums; }
.stat-value.accent { color: var(--accent); }
.stat-value.green { color: #10b981; }
.stat-value.orange { color: #f59e0b; }
.stat-label { font-size: 12px; color: var(--text-quaternary); }

/* Two columns */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }

/* Panel */
.panel {
  background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle);
  border-radius: 12px; padding: 16px; margin-bottom: 16px;
}
.panel-header { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.panel-icon { font-size: 16px; }
.panel-title { font-size: 14px; font-weight: 510; color: var(--text-secondary); }
.panel-count {
  font-size: 11px; font-family: var(--font-mono); color: var(--accent);
  background: rgba(113,112,255,0.1); padding: 1px 8px; border-radius: 10px;
}
.panel-badge { font-size: 11px; color: var(--text-quaternary); margin-left: auto; font-family: var(--font-mono); }

/* Todo */
.todo-list { display: flex; flex-direction: column; gap: 6px; }
.todo-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; transition: background 0.15s; }
.todo-item:hover { background: rgba(255,255,255,0.03); }
.todo-item.done .todo-text { color: var(--text-quaternary); text-decoration: line-through; }
.todo-check {
  width: 18px; height: 18px; border-radius: 4px; border: 1.5px solid var(--border-standard);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.todo-check.checked { border-color: #10b981; background: rgba(16,185,129,0.1); }
.dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.todo-text { font-size: 13px; color: var(--text-secondary); }

/* Task */
.task-list { display: flex; flex-direction: column; gap: 12px; }
.task-item { padding: 10px 12px; background: rgba(255,255,255,0.015); border-radius: 8px; }
.task-info { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.task-title { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
.task-tag { font-size: 10px; font-weight: 510; padding: 2px 8px; border-radius: 10px; }
.task-progress { display: flex; align-items: center; gap: 8px; }
.task-bar { flex: 1; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; }
.task-fill { height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.5s ease; }
.task-pct { font-size: 11px; font-family: var(--font-mono); color: var(--text-quaternary); min-width: 32px; text-align: right; }

/* Habits */
.habit-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.habit-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; background: rgba(255,255,255,0.015);
  border: 1px solid var(--border-subtle); border-radius: 8px;
  transition: all 0.15s;
}
.habit-item.checked { border-color: rgba(16,185,129,0.15); background: rgba(16,185,129,0.04); }
.habit-check {
  width: 20px; height: 20px; border-radius: 6px; border: 1.5px solid var(--border-standard);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.habit-item.checked .habit-check { border-color: #10b981; background: rgba(16,185,129,0.1); }
.habit-name { font-size: 13px; color: var(--text-secondary); }

/* Review */
.review-text { font-size: 13px; color: var(--text-tertiary); line-height: 1.7; }

@media (max-width: 768px) {
  .stats-bar { grid-template-columns: 1fr 1fr; }
  .two-col { grid-template-columns: 1fr; }
  .habit-grid { grid-template-columns: 1fr 1fr; }
}
</style>
