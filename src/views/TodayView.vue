<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNotion } from '../composables/useNotion'

const { loading, error, fetchToday } = useNotion()

const data = ref<any>(null)
let refreshInterval: ReturnType<typeof setInterval> | null = null

async function loadData() {
  const result = await fetchToday()
  if (result) {
    data.value = result
  }
}

onMounted(() => {
  loadData()
  refreshInterval = setInterval(loadData, 30000) // 30s auto-refresh
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})

// Computed properties from API data
const todos = computed(() => data.value?.todos || [])
const tasks = computed(() => data.value?.tasks || [])
const habits = computed(() => {
  const habitChecks = data.value?.habits?.[0]?.checks || {}
  return Object.entries(habitChecks).map(([name, checked], id) => ({
    id,
    name,
    checked: !!checked,
    url: data.value?.habits?.[0]?.url
  }))
})
const dayReview = computed(() => data.value?.review?.plan || '暂无日复盘')
const stats = computed(() => data.value?.stats || {
  pendingTodos: 0,
  activeTasks: 0,
  completedToday: 0,
  habitRate: 0
})

function priorityColor(p: string) {
  if (p === '1st' || p === 'urgent') return '#ef4444'
  if (p === '2nd' || p === 'high') return '#f59e0b'
  if (p === '3rd' || p === 'medium') return '#62666d'
  return '#62666d' // '4th' or 'low'
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
    <!-- Loading State -->
    <div v-if="loading && !data" class="loading-state">加载中...</div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <!-- Content -->
    <template v-else>
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
            <a v-for="todo in todos" :key="todo.id" class="todo-item" :class="{ done: todo.done }" :href="todo.url" target="_blank">
              <div class="todo-check" :class="{ checked: todo.done }">
                <svg v-if="todo.done" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <span class="dot" :style="{ background: todo.done ? 'var(--text-quaternary)' : priorityColor(todo.priority) }"></span>
              <span class="todo-text">{{ todo.title }}</span>
            </a>
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
            <a v-for="task in tasks" :key="task.id" class="task-item" :href="task.url" target="_blank">
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
            </a>
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
          <a v-for="habit in habits" :key="habit.id" class="habit-item" :class="{ checked: habit.checked }" :href="habit.url" target="_blank">
            <div class="habit-check">
              <svg v-if="habit.checked" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <span class="habit-name">{{ habit.name }}</span>
          </a>
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
    </template>
  </div>
</template>

<style scoped>
.today { padding-top: 32px; }

/* Loading & Error States */
.loading-state, .error-state {
  text-align: center; padding: 60px 0; font-size: 14px; color: var(--text-tertiary);
}
.error-state { color: #ef4444; }

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
.todo-item {
  display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; transition: background 0.15s;
  text-decoration: none; color: inherit;
}
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
.task-item {
  padding: 10px 12px; background: rgba(255,255,255,0.015); border-radius: 8px;
  text-decoration: none; color: inherit; display: block;
}
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
  transition: all 0.15s; text-decoration: none; color: inherit;
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
