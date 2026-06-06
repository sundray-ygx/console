<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNotion } from '../composables/useNotion'

interface PlanItem {
  id: string
  title: string
  plan: string | null
  level: 'week' | 'month' | 'quarter'
  date?: string | null
}

interface TodoItem {
  id: string
  title: string
  priority?: string
  category?: string
  dueDate?: string
  url?: string
}

interface ReviewItem {
  id: string
  title: string
  review: string | null
  level: 'day' | 'week' | 'month' | 'quarter'
  date?: string | null
}

const { fetchPdcaCurrent, fetchToday, loading, error } = useNotion()

const plans = ref<PlanItem[]>([])
const todos = ref<TodoItem[]>([])
const checkReviews = ref<ReviewItem[]>([])
const actReviews = ref<ReviewItem[]>([])

onMounted(async () => {
  const [currentData, todayData] = await Promise.all([
    fetchPdcaCurrent(),
    fetchToday(),
  ])

  // Plan column from /api/notion/pdca/current
  if (currentData) {
    const planItems: PlanItem[] = []
    if (currentData.plan?.quarter?.plan) {
      planItems.push({ ...currentData.plan.quarter, id: currentData.plan.quarter.id + '-plan', level: 'quarter' })
    }
    if (currentData.plan?.month?.plan) {
      planItems.push({ ...currentData.plan.month, id: currentData.plan.month.id + '-plan', level: 'month' })
    }
    if (currentData.plan?.week?.plan) {
      planItems.push({ ...currentData.plan.week, id: currentData.plan.week.id + '-plan', level: 'week' })
    }
    plans.value = planItems

    // Check column: day reviews + week review
    const checkItems: ReviewItem[] = []
    if (currentData.check?.dayReviews) {
      for (const dr of currentData.check.dayReviews) {
        checkItems.push({ ...dr, id: dr.id + '-review', level: 'day' })
      }
    }
    if (currentData.check?.weekReview?.review) {
      checkItems.push({ ...currentData.check.weekReview, id: currentData.check.weekReview.id + '-review', level: 'week' })
    }
    checkReviews.value = checkItems

    // Act column: month review + quarter review
    const actItems: ReviewItem[] = []
    if (currentData.act?.monthReview?.review) {
      actItems.push({ ...currentData.act.monthReview, id: currentData.act.monthReview.id + '-review', level: 'month' })
    }
    if (currentData.act?.quarterReview?.review) {
      actItems.push({ ...currentData.act.quarterReview, id: currentData.act.quarterReview.id + '-review', level: 'quarter' })
    }
    actReviews.value = actItems
  }

  // Do column from /api/notion/today
  if (todayData?.todos) {
    todos.value = todayData.todos
      .filter((t: any) => t.priority === '1st' || t.priority === '2nd')
      .slice(0, 15)
      .map((t: any) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        category: t.category,
        dueDate: t.dueDate,
        url: t.url,
      }))
  }
})

function truncate(text: string, len = 120): string {
  if (!text) return ''
  return text.length > len ? text.substring(0, len) + '...' : text
}

function levelBadge(level: string) {
  const map: Record<string, string> = { week: '周', month: '月', quarter: '季', day: '日' }
  return map[level] || level
}
</script>

<template>
  <div class="pdca">
    <h1 class="page-title">PDCA 看板</h1>
    <p class="page-subtitle">Plan → Do → Check → Act</p>

    <div v-if="loading && plans.length === 0" class="loading-state">
      <span class="loading-spinner">⟳</span>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{{ error }}</p>
    </div>

    <div v-else class="kanban">
      <!-- P: Plan -->
      <div class="kanban-column plan">
        <div class="column-header">
          <span class="column-letter">P</span>
          <span class="column-title">Plan · 计划</span>
          <span class="column-count">{{ plans.length }}</span>
        </div>
        <div class="column-cards">
          <div v-for="item in plans" :key="item.id" class="card">
            <div class="card-header">
              <span class="card-badge plan-level">{{ levelBadge(item.level) }}计划</span>
              <span v-if="item.date" class="card-date">{{ item.date }}</span>
            </div>
            <p class="card-text">{{ truncate(item.plan, 200) }}</p>
          </div>
          <div v-if="plans.length === 0" class="empty-hint">暂无计划</div>
        </div>
      </div>

      <!-- D: Do -->
      <div class="kanban-column do">
        <div class="column-header">
          <span class="column-letter">D</span>
          <span class="column-title">Do · 执行</span>
          <span class="column-count">{{ todos.length }}</span>
        </div>
        <div class="column-cards">
          <div v-for="item in todos" :key="item.id" class="card todo-card">
            <div class="card-header">
              <span v-if="item.priority" class="card-badge" :class="'prio-' + item.priority">{{ item.priority }}</span>
              <span v-if="item.dueDate" class="card-date">{{ item.dueDate }}</span>
            </div>
            <p class="card-text">{{ item.title }}</p>
            <span v-if="item.category" class="card-category">{{ item.category }}</span>
          </div>
          <div v-if="todos.length === 0" class="empty-hint">暂无待办</div>
        </div>
      </div>

      <!-- C: Check -->
      <div class="kanban-column check">
        <div class="column-header">
          <span class="column-letter">C</span>
          <span class="column-title">Check · 检查</span>
          <span class="column-count">{{ checkReviews.length }}</span>
        </div>
        <div class="column-cards">
          <div v-for="item in checkReviews" :key="item.id" class="card">
            <div class="card-header">
              <span class="card-badge check-level">{{ levelBadge(item.level) }}复盘</span>
              <span v-if="item.date" class="card-date">{{ item.date }}</span>
            </div>
            <p class="card-text">{{ truncate(item.review, 150) }}</p>
          </div>
          <div v-if="checkReviews.length === 0" class="empty-hint">暂无复盘</div>
        </div>
      </div>

      <!-- A: Act -->
      <div class="kanban-column act">
        <div class="column-header">
          <span class="column-letter">A</span>
          <span class="column-title">Act · 改进</span>
          <span class="column-count">{{ actReviews.length }}</span>
        </div>
        <div class="column-cards">
          <div v-for="item in actReviews" :key="item.id" class="card">
            <div class="card-header">
              <span class="card-badge act-level">{{ levelBadge(item.level) }}复盘</span>
              <span v-if="item.date" class="card-date">{{ item.date }}</span>
            </div>
            <p class="card-text">{{ truncate(item.review, 150) }}</p>
          </div>
          <div v-if="actReviews.length === 0" class="empty-hint">暂无行动</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pdca { padding-top: 32px; }
.page-title { font-size: 28px; font-weight: 510; letter-spacing: -0.6px; color: var(--text-primary); margin-bottom: 4px; }
.page-subtitle { font-size: 14px; color: var(--text-tertiary); margin-bottom: 24px; }

.loading-state, .error-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 60px 20px; color: var(--text-tertiary);
}
.loading-spinner { font-size: 32px; animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.error-icon { font-size: 32px; }

/* Kanban Layout */
.kanban {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  min-height: 400px;
}

.kanban-column {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  overflow: hidden;
}

.column-header {
  display: flex; align-items: center; gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.column-letter {
  width: 28px; height: 28px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: #fff;
}
.plan .column-letter { background: #7170ff; }
.do .column-letter { background: #10b981; }
.check .column-letter { background: #fbbf24; color: #000; }
.act .column-letter { background: #ef4444; }

.column-title { font-size: 13px; font-weight: 510; color: var(--text-secondary); flex: 1; }
.column-count {
  font-size: 11px; font-family: var(--font-mono); color: var(--text-quaternary);
  padding: 2px 6px; border-radius: 4px; background: var(--bg-canvas);
}

.column-cards {
  flex: 1; overflow-y: auto; padding: 10px;
  display: flex; flex-direction: column; gap: 8px;
}

/* Cards */
.card {
  padding: 12px; border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-panel);
  transition: border-color 0.15s;
}
.card:hover { border-color: var(--border-standard); }

.card-header {
  display: flex; align-items: center; gap: 6px; margin-bottom: 8px;
}

.card-badge {
  font-size: 10px; padding: 1px 6px; border-radius: 4px;
  font-weight: 500;
}
.plan-level { background: color-mix(in srgb, #7170ff 15%, transparent); color: #7170ff; }
.check-level { background: color-mix(in srgb, #fbbf24 15%, transparent); color: #fbbf24; }
.act-level { background: color-mix(in srgb, #ef4444 15%, transparent); color: #ef4444; }

.prio-1st { background: color-mix(in srgb, #ef4444 15%, transparent); color: #ef4444; }
.prio-2nd { background: color-mix(in srgb, #fbbf24 15%, transparent); color: #fbbf24; }
.prio-3rd { background: color-mix(in srgb, #10b981 15%, transparent); color: #10b981; }

.card-date { font-size: 10px; font-family: var(--font-mono); color: var(--text-quaternary); }
.card-text {
  font-size: 12px; color: var(--text-tertiary); line-height: 1.6;
  white-space: pre-line; word-break: break-all;
}
.card-category {
  display: inline-block; margin-top: 6px;
  font-size: 10px; color: var(--text-quaternary);
}

.empty-hint {
  text-align: center; padding: 24px 12px; font-size: 12px; color: var(--text-quaternary);
}

@media (max-width: 1200px) {
  .kanban { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .kanban { grid-template-columns: 1fr; }
}
</style>
