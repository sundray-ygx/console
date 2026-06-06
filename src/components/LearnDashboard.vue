<script setup lang="ts">
import type { Dashboard, Catalog, ReviewDue, ReviewDueItem } from '../composables/useCourses'
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
</script>

<template>
  <div class="dashboard">
    <!-- 待复习提醒（仅有数据时显示） -->
    <section v-if="reviewDue && reviewDue.total > 0" class="review-alert">
      <div class="ra-head">
        <span class="ra-icon">🔁</span>
        <div class="ra-title">
          {{ reviewDue.total }} 个课时待复习
        </div>
        <span class="ra-date">{{ reviewDue.date }}</span>
      </div>
      <div class="ra-list">
        <div
          v-for="item in reviewDue.items.slice(0, 5)"
          :key="item.course_id + item.lesson_id"
          class="ra-item"
          :class="{ overdue: item.days_overdue > 0 }"
          @click="emit('select-lesson', item.course_id, item.chapter_id, item.lesson_id)"
        >
          <span class="ra-emoji">{{ item.course_emoji }}</span>
          <div class="ra-meta">
            <div class="ra-ltitle">{{ item.lesson_title }}</div>
            <div class="ra-ctitle">{{ item.course_title }} · 第 {{ item.review_count }} 次复习</div>
          </div>
          <span class="ra-due">{{ dueLabel(item) }}</span>
        </div>
      </div>
    </section>

    <!-- 总览 -->
    <section class="overview">
      <div class="overview-grid">
        <div class="stat-card stat-hero">
          <div class="stat-hero-left">
            <div class="stat-label">总体进度</div>
            <div class="stat-hero-value">
              <span class="num">{{ dashboard?.overall_percent ?? 0 }}</span>
              <span class="unit">%</span>
            </div>
            <div class="stat-sub">
              {{ dashboard?.total_read ?? 0 }} / {{ dashboard?.total_lessons ?? 0 }} 课时已读
            </div>
          </div>
          <div class="stat-hero-right">
            <ProgressRing :percent="dashboard?.overall_percent ?? 0" :size="72" :stroke="6" />
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-label">课程数</div>
          <div class="stat-value">{{ fmt(dashboard?.total_courses ?? 0) }}</div>
          <div class="stat-sub">{{ catalog?.courses.length ?? 0 }} 个学习主题</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">资料篇数</div>
          <div class="stat-value">{{ fmt(dashboard?.total_materials ?? 0) }}</div>
          <div class="stat-sub">来自 Notion 收藏</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">已收藏</div>
          <div class="stat-value">{{ fmt(dashboard?.total_favorited ?? 0) }}</div>
          <div class="stat-sub">⭐ 收藏的课时</div>
        </div>
      </div>
    </section>

    <!-- 各课程进度 -->
    <section class="courses">
      <div class="section-header">
        <h2 class="section-title">课程进度</h2>
        <span class="section-hint">点击进入课程</span>
      </div>

      <div v-if="!dashboard" class="empty">
        <span class="loading-spinner">⟳</span>
        <p>加载中...</p>
      </div>

      <div v-else class="course-grid">
        <div
          v-for="c in dashboard.courses_progress"
          :key="c.id"
          class="course-card"
          @click="emit('select-course', c.id)"
        >
          <div class="cc-head">
            <span class="cc-emoji">{{ c.cover_emoji || '📚' }}</span>
            <div class="cc-meta">
              <div class="cc-title">{{ c.title }}</div>
              <div class="cc-sub">
                {{ c.read_lessons }} / {{ c.total_lessons }} 课时 · {{ c.percent }}%
              </div>
            </div>
            <ProgressRing :percent="c.percent" :size="32" :stroke="3" />
          </div>
          <div class="cc-bar">
            <div class="cc-bar-fill" :style="{ width: c.percent + '%' }" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex; flex-direction: column; gap: 28px;
  padding-top: 32px;
}

/* Review alert */
.review-alert {
  padding: 16px 18px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, color-mix(in srgb, #f87171 12%, var(--bg-panel)) 0%, var(--bg-panel) 70%);
  border: 1px solid color-mix(in srgb, #f87171 25%, var(--border-subtle));
}
.ra-head {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 12px;
}
.ra-icon { font-size: 22px; flex-shrink: 0; }
.ra-title {
  flex: 1;
  font-size: 15px; font-weight: 510;
  color: var(--text-primary);
}
.ra-date {
  font-size: 11px; color: var(--text-quaternary);
  font-family: var(--font-mono);
}

.ra-list {
  display: flex; flex-direction: column; gap: 6px;
}
.ra-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: var(--bg-canvas);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all 0.15s;
}
.ra-item:hover {
  background: var(--bg-surface);
  border-color: var(--border-standard);
}
.ra-item.overdue {
  border-left: 3px solid #f87171;
}
.ra-emoji { font-size: 18px; flex-shrink: 0; }
.ra-meta { flex: 1; min-width: 0; }
.ra-ltitle {
  font-size: 13px; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ra-ctitle {
  font-size: 11px; color: var(--text-quaternary);
  margin-top: 2px;
}
.ra-due {
  font-size: 11px; padding: 2px 8px;
  border-radius: var(--radius-pill);
  font-family: var(--font-mono);
  background: color-mix(in srgb, #fbbf24 18%, transparent);
  color: #fbbf24;
  flex-shrink: 0;
}
.ra-item.overdue .ra-due {
  background: color-mix(in srgb, #f87171 18%, transparent);
  color: #f87171;
}

/* Overview */
.overview-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: 14px;
}

.stat-card {
  padding: 16px 18px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  background: var(--bg-panel);
  display: flex; flex-direction: column; gap: 8px;
  min-height: 96px;
}

.stat-hero {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, var(--bg-panel)) 0%, var(--bg-panel) 70%);
  border-color: color-mix(in srgb, var(--accent) 25%, var(--border-subtle));
}
.stat-hero-left { display: flex; flex-direction: column; gap: 6px; }
.stat-hero-right { flex-shrink: 0; }
.stat-hero-value {
  font-size: 36px; font-weight: 510; letter-spacing: -1px;
  color: var(--text-primary); line-height: 1;
  font-family: var(--font-mono);
}
.stat-hero-value .unit {
  font-size: 18px; color: var(--text-tertiary); margin-left: 2px;
}

.stat-label {
  font-size: 11px; color: var(--text-quaternary);
  text-transform: uppercase; letter-spacing: 0.6px;
  font-weight: 500;
}
.stat-value {
  font-size: 24px; font-weight: 510; color: var(--text-primary);
  font-family: var(--font-mono); line-height: 1.2;
}
.stat-sub {
  font-size: 11px; color: var(--text-tertiary);
  margin-top: auto;
}

/* Section header */
.section-header {
  display: flex; align-items: baseline; justify-content: space-between;
  margin-bottom: 14px;
}
.section-title {
  font-size: 16px; font-weight: 510; color: var(--text-primary); margin: 0;
}
.section-hint {
  font-size: 11px; color: var(--text-quaternary);
}

/* Courses */
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.course-card {
  padding: 14px 16px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  background: var(--bg-panel);
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s, background 0.15s;
}
.course-card:hover {
  border-color: var(--accent);
  background: var(--bg-surface);
}
.course-card:active { transform: scale(0.995); }

.cc-head {
  display: flex; align-items: center; gap: 12px; margin-bottom: 10px;
}
.cc-emoji {
  font-size: 24px; flex-shrink: 0;
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-md);
  background: var(--bg-canvas);
}
.cc-meta { flex: 1; min-width: 0; }
.cc-title {
  font-size: 13px; font-weight: 510; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cc-sub {
  font-size: 11px; color: var(--text-tertiary);
  font-family: var(--font-mono);
  margin-top: 2px;
}

.cc-bar {
  height: 3px; border-radius: 2px;
  background: var(--bg-canvas);
  overflow: hidden;
}
.cc-bar-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.4s ease;
}

/* Empty */
.empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; padding: 40px 20px; color: var(--text-tertiary);
}
.loading-spinner { font-size: 28px; animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* Responsive */
@media (max-width: 1100px) {
  .overview-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 600px) {
  .overview-grid { grid-template-columns: 1fr; }
  .course-grid { grid-template-columns: 1fr; }
}
</style>
