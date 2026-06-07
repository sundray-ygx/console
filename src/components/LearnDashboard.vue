<script setup lang="ts">
import { computed } from 'vue'
import type { Dashboard, Catalog, ReviewDue, ReviewDueItem, DashboardCourseProgress } from '../composables/useCourses'
import ProgressRing from './ProgressRing.vue'

const props = defineProps<{
  dashboard: Dashboard | null
  catalog: Catalog | null
  reviewDue: ReviewDue | null
}>()

const emit = defineEmits<{
  (e: 'select-course', id: string): void
  (e: 'select-lesson', courseId: string, chapterId: string, lessonId: string): void
}>()

function fmt(n: number): string {
  return n.toLocaleString('zh-CN')
}

function dueLabel(item: ReviewDueItem): string {
  if (item.days_overdue === 0) return '今日'
  if (item.days_overdue === 1) return '逾期 1 天'
  return `逾期 ${item.days_overdue} 天`
}

// ── Next Best Action ──
type ActionType =
  { type: 'review'; count: number; items: ReviewDueItem[] }
  | { type: 'continue'; course: DashboardCourseProgress; lesson: string | null }
  | { type: 'explore'; }

const nextAction = computed<ActionType | null>(() => {
  if (!props.dashboard) return null

  const due = props.reviewDue
  if (due && due.total > 0) {
    return { type: 'review', count: due.total, items: due.items.slice(0, 3) }
  }

  const courses = props.dashboard.courses_progress
  const inProgress = courses.filter(c => c.percent > 0 && c.percent < 100)
  if (inProgress.length > 0) {
    const sorted = inProgress.sort((a, b) => (b.percent || 0) - (a.percent || 0))
    return { type: 'continue', course: sorted[sorted.length - 1], lesson: null }
  }

  const unstarted = courses.filter(c => c.percent === 0)
  if (unstarted.length > 0) {
    return { type: 'continue', course: unstarted[0], lesson: null }
  }

  return { type: 'explore' }
})

// Computed: sorted course list (unstarted last, in-progress by recency, completed last)
const sortedCourses = computed<DashboardCourseProgress[]>(() => {
  const c = props.dashboard?.courses_progress || []
  if (!c.length) return c
  return [...c].sort((a, b) => {
    if (a.percent === 0 && b.percent > 0) return 1
    if (b.percent === 0 && a.percent > 0) return -1
    if (a.percent < 100 && b.percent < 100) {
      const aT = a.last_read ? new Date(a.last_read).getTime() : 0
      const bT = b.last_read ? new Date(b.last_read).getTime() : 0
      return bT - aT
    }
    if (a.percent >= 100 && b.percent < 100) return 1
    if (b.percent >= 100 && a.percent < 100) return -1
    return 0
  })
})

// ── Course card helpers ──
function colorForPercent(pct: number): string {
  if (pct >= 80) return '#10b981'
  if (pct >= 50) return 'var(--accent)'
  if (pct >= 20) return '#f59e0b'
  return 'var(--text-quaternary)'
}

function daysSince(dateStr?: string | null): string {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return '今天'
  if (diff === 1) return '昨天'
  return `${diff} 天前`
}
</script>

<template>
  <div class="dashboard">
    <!-- ⭐ Next Best Action -->
    <section class="nba">
      <template v-if="nextAction?.type === 'review'">
        <div class="nba-banner review-banner">
          <span class="nba-icon">🔁</span>
          <div class="nba-body">
            <div class="nba-title">{{ nextAction.count }} 个课时待复习</div>
            <div class="nba-sub">优先处理到期复习，巩固记忆效果最佳</div>
            <div class="nba-items">
              <div
                v-for="item in nextAction.items"
                :key="item.course_id + item.lesson_id"
                class="nba-item"
                :class="{ overdue: item.days_overdue > 0 }"
                @click="emit('select-lesson', item.course_id, item.chapter_id, item.lesson_id)"
              >
                <span class="nba-emoji">{{ item.course_emoji }}</span>
                <span class="nba-ltitle">{{ item.lesson_title }}</span>
                <span class="nba-due">{{ dueLabel(item) }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-else-if="nextAction?.type === 'continue'">
        <div class="nba-banner continue-banner" @click="emit('select-course', nextAction.course.id)">
          <span class="nba-icon">📖</span>
          <div class="nba-body">
            <div class="nba-title">继续学习：{{ nextAction.course.title }}</div>
            <div class="nba-sub">
              {{ nextAction.course.read_lessons }} / {{ nextAction.course.total_lessons }} 课时 ·
              {{ nextAction.course.percent }}% 已完成
            </div>
            <div class="nba-bar">
              <div class="nba-bar-fill" :style="{ width: nextAction.course.percent + '%' }"></div>
            </div>
          </div>
        </div>
      </template>
      <template v-else-if="nextAction?.type === 'explore'">
        <div class="nba-banner explore-banner" @click="emit('select-course', '')">
          <span class="nba-icon">🚀</span>
          <div class="nba-body">
            <div class="nba-title">开始新的学习</div>
            <div class="nba-sub">浏览课程目录，选择下一个主题</div>
          </div>
        </div>
      </template>
    </section>

    <!-- Stats overview -->
    <section class="overview">
      <div class="overview-grid">
        <div class="stat-card stat-progress">
          <div class="stat-row">
            <div>
              <div class="stat-label">Overall Progress</div>
              <div class="stat-hero-value">
                <span class="num">{{ dashboard?.overall_percent ?? 0 }}</span><span class="unit">%</span>
              </div>
              <div class="stat-sub">{{ dashboard?.total_read ?? 0 }}/{{ dashboard?.total_lessons ?? 0 }} lessons</div>
            </div>
            <ProgressRing :percent="dashboard?.overall_percent ?? 0" :size="60" :stroke="5" />
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Courses</div>
          <div class="stat-mono">{{ fmt(dashboard?.total_courses ?? 0) }}</div>
          <div class="stat-sub">{{ catalog?.courses.length ?? 0 }} subjects</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Materials</div>
          <div class="stat-mono">{{ fmt(dashboard?.total_materials ?? 0) }}</div>
          <div class="stat-sub">from Notion sources</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Favorites</div>
          <div class="stat-mono">{{ fmt(dashboard?.total_favorited ?? 0) }}</div>
          <div class="stat-sub">⭐ bookmarked lessons</div>
        </div>
      </div>
    </section>

    <!-- Weekly Focus hint -->
    <section v-if="reviewDue && reviewDue.total > 0" class="focus-hint">
      <span class="focus-icon">🎯</span>
      <span class="focus-text">本周焦点：优先完成 <strong>{{ reviewDue.total }}</strong> 个待复习课时，保持学习连续性</span>
    </section>
    <section v-else-if="dashboard && dashboard.total_lessons > 0" class="focus-hint">
      <span class="focus-icon">🎯</span>
      <span class="focus-text">本周焦点：当前进度 <strong>{{ dashboard.overall_percent }}%</strong>，目标突破 50%</span>
    </section>

    <!-- Course progress -->
    <section class="courses">
      <div class="section-header">
        <h2 class="section-title">Courses</h2>
        <span class="section-hint">click to enter</span>
      </div>
      <div v-if="!dashboard" class="empty">
        <span class="loading-spinner">⟳</span>
        <p>loading...</p>
      </div>
      <div v-else-if="dashboard.courses_progress.length === 0" class="empty">
        <p>No courses yet</p>
      </div>
      <div v-else class="course-grid">
        <div
          v-for="c in sortedCourses"
          :key="c.id"
          class="course-card"
          @click="emit('select-course', c.id)"
        >
          <div class="cc-head">
            <span class="cc-emoji">{{ c.cover_emoji || '📚' }}</span>
            <div class="cc-meta">
              <div class="cc-title">{{ c.title }}</div>
              <div class="cc-sub">{{ c.read_lessons }}/{{ c.total_lessons }} · {{ c.percent }}%</div>
            </div>
            <ProgressRing :percent="c.percent" :size="30" :stroke="3" />
          </div>
          <div class="cc-bar" :style="{ background: colorForPercent(c.percent) + '22' }">
            <div class="cc-bar-fill" :style="{ width: c.percent + '%', background: colorForPercent(c.percent) }" />
          </div>
          <div class="cc-footer">
            <span v-if="c.percent === 0" class="cc-tag">未开始</span>
            <span v-else-if="c.percent === 100" class="cc-tag done">✓ 完成</span>
            <span v-else class="cc-tag ongoing">{{ c.percent }}%</span>
            <span v-if="c.last_read" class="cc-last">上次 {{ daysSince(c.last_read) }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>

/* Next Best Action */
.nba { }
.nba-banner {
  display: flex; gap: 16px; align-items: flex-start;
  padding: 18px; border-radius: 14px;
  cursor: default; transition: transform 0.15s;
}
.nba-banner.review-banner {
  background: linear-gradient(135deg, color-mix(in srgb, #f87171 14%, var(--bg-surface)) 0%, var(--bg-surface) 70%);
  border: 1px solid color-mix(in srgb, #f87171 25%, var(--border-subtle));
}
.nba-banner.continue-banner {
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, var(--bg-surface)) 0%, var(--bg-surface) 70%);
  border: 1px solid color-mix(in srgb, var(--accent) 22%, var(--border-subtle));
  cursor: pointer;
}
.nba-banner.explore-banner {
  background: linear-gradient(135deg, color-mix(in srgb, #10b981 10%, var(--bg-surface)) 0%, var(--bg-surface) 70%);
  border: 1px solid color-mix(in srgb, #10b981 20%, var(--border-subtle));
  cursor: pointer;
}
.nba-banner:hover { transform: translateY(-1px); }
.nba-icon { font-size: 28px; flex-shrink: 0; margin-top: 2px; }
.nba-body { flex: 1; }
.nba-title { font-size: 16px; font-weight: 510; color: var(--text-primary); margin-bottom: 2px; }
.nba-sub { font-size: 12px; color: var(--text-tertiary); margin-bottom: 12px; }
.nba-items { display: flex; flex-direction: column; gap: 6px; }
.nba-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; border-radius: 8px;
  background: var(--bg-canvas); cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.12s;
}
.nba-item:hover { border-color: var(--border-subtle); }
.nba-item.overdue { border-left: 3px solid #f87171; }
.nba-emoji { font-size: 16px; }
.nba-ltitle { flex: 1; font-size: 13px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nba-due { font-size: 11px; font-family: var(--font-mono); color: #fbbf24; padding: 2px 6px; border-radius: 4px; background: color-mix(in srgb, #fbbf24 15%, transparent); flex-shrink: 0; }
.nba-bar { height: 4px; border-radius: 2px; background: rgba(255,255,255,0.05); overflow: hidden; margin-top: 8px; }
.nba-bar-fill { height: 100%; border-radius: 2px; background: var(--accent); }

/* Stats */
.overview-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 14px; }
.stat-card { padding: 16px 18px; border-radius: 12px; border: 1px solid var(--border-subtle); background: var(--bg-panel); display: flex; flex-direction: column; gap: 6px; min-height: 80px; }
.stat-progress { background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, var(--bg-panel)) 0%, var(--bg-panel) 70%); border-color: color-mix(in srgb, var(--accent) 22%, var(--border-subtle)); }
.stat-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 100%; }
.stat-hero-value { font-size: 32px; font-weight: 510; letter-spacing: -0.8px; color: var(--text-primary); line-height: 1; font-family: var(--font-mono); }
.stat-hero-value .unit { font-size: 16px; color: var(--text-tertiary); margin-left: 2px; }
.stat-mono { font-size: 22px; font-weight: 510; color: var(--text-primary); font-family: var(--font-mono); line-height: 1.2; }
.stat-label { font-size: 11px; color: var(--text-quaternary); text-transform: uppercase; letter-spacing: 0.6px; font-weight: 500; }
.stat-sub { font-size: 11px; color: var(--text-tertiary); margin-top: auto; }

/* Weekly Focus */
.focus-hint { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-radius: 8px; background: var(--bg-surface); border: 1px solid var(--border-subtle); }
.focus-icon { font-size: 16px; }
.focus-text { font-size: 13px; color: var(--text-secondary); }
.focus-text strong { color: var(--text-primary); font-weight: 510; }

/* Section header */
.section-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }
.section-title { font-size: 16px; font-weight: 510; color: var(--text-primary); margin: 0; }
.section-hint { font-size: 11px; color: var(--text-quaternary); }

/* Courses */
.course-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.course-card { padding: 14px 16px; border-radius: 12px; border: 1px solid var(--border-subtle); background: var(--bg-panel); cursor: pointer; transition: border-color 0.15s, transform 0.15s; }
.course-card:hover { border-color: var(--border-standard); transform: translateY(-1px); }
.cc-head { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.cc-emoji { font-size: 22px; flex-shrink: 0; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: var(--bg-canvas); }
.cc-meta { flex: 1; min-width: 0; }
.cc-title { font-size: 13px; font-weight: 510; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cc-sub { font-size: 11px; color: var(--text-tertiary); font-family: var(--font-mono); margin-top: 2px; }
.cc-bar { height: 3px; border-radius: 2px; overflow: hidden; margin-bottom: 8px; }
.cc-bar-fill { height: 100%; border-radius: 2px; transition: width 0.4s ease; }
.cc-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.cc-tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; color: var(--text-quaternary); background: var(--bg-canvas); }
.cc-tag.ongoing { color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); }
.cc-tag.done { color: #10b981; background: color-mix(in srgb, #10b981 12%, transparent); }
.cc-last { font-size: 10px; font-family: var(--font-mono); color: var(--text-quaternary); }

/* Empty & Loading */
.empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px 20px; color: var(--text-tertiary); }
.loading-spinner { font-size: 28px; animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

@media (max-width: 1100px) { .overview-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 600px) { .overview-grid { grid-template-columns: 1fr; } .course-grid { grid-template-columns: 1fr; } }
</style>
