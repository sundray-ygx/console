<script setup lang="ts">
import { ref } from 'vue'
import type { Lesson, Chapter, LessonProgress, CodeExample, Exercise } from '../composables/useCourses'
import MaterialCard from './MaterialCard.vue'

const props = defineProps<{
  lesson: Lesson | null
  chapter: Chapter | null
  progress: LessonProgress | null        // 当前课时的进度状态
  courseId?: string | null               // 当前课程 ID（用于复习结果记录）
}>()

// 练习答案展开状态（按 index）
const expandedAnswers = ref<Set<number>>(new Set())
function toggleAnswer(idx: number) {
  if (expandedAnswers.value.has(idx)) {
    expandedAnswers.value.delete(idx)
  } else {
    expandedAnswers.value.add(idx)
  }
}
// deep_content 渲染：把 **xxx** 转 <strong>，换行符转 <br>
function renderMd(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
}

const emit = defineEmits<{
  (e: 'update-status', status: LessonProgress['status']): void
  (e: 'prev-lesson'): void
  (e: 'next-lesson'): void
}>()

const STATUSES: { value: LessonProgress['status']; label: string; icon: string }[] = [
  { value: 'unread',   label: '未读', icon: '○' },
  { value: 'reading',  label: '在读', icon: '◐' },
  { value: 'read',     label: '已读', icon: '●' },
  { value: 'review',   label: '复习', icon: '↻' },
  { value: 'favorite', label: '收藏', icon: '★' },
]

const recording = ref(false)

async function recordReview(outcome: string) {
  if (!props.courseId || !props.lesson?.lesson_id) return
  recording.value = true
  try {
    const res = await fetch(`/api/learn/reviews/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_id: props.courseId,
        lesson_id: props.lesson.lesson_id,
        outcome,
      }),
    })
    const data = await res.json()
    if (data.ok) {
      emit('update-status', 'review')
    }
  } catch (e: any) {
    console.error('Review result failed:', e.message)
  } finally {
    recording.value = false
  }
}

function typeColor(type: string): string {
  switch (type) {
    case '概念': return 'concept'
    case '实操': return 'practice'
    case '案例': return 'case'
    case '工具': return 'tool'
    default: return 'concept'
  }
}
</script>

<template>
  <div class="lesson-detail">
    <!-- Empty state -->
    <div v-if="!lesson || !chapter" class="empty-state">
      <span class="empty-icon">📖</span>
      <p class="empty-title">从左侧选择一个课时</p>
      <p class="empty-sub">或点击"仪表盘"查看学习总览</p>
    </div>

    <!-- Detail -->
    <article v-else class="article">
      <!-- Header -->
      <header class="art-head">
        <div class="art-breadcrumb">
          <span>{{ chapter.title }}</span>
          <span class="sep">›</span>
          <span class="active">第 {{ lesson.lesson_id }} 节</span>
        </div>

        <h1 class="art-title">{{ lesson.title }}</h1>

        <div class="art-tags">
          <span class="tag" :class="'lvl-' + (lesson.level || 'L1')">{{ lesson.level || 'L1' }}</span>
          <span class="tag" :class="'type-' + typeColor(lesson.type)">
            {{ lesson.type || '概念' }}
          </span>
          <span v-for="t in lesson.tags" :key="t" class="tag tag-neutral">{{ t }}</span>
        </div>

        <!-- 状态切换 + 上下节导航 -->
        <div class="art-toolbar">
          <div class="status-switcher">
            <button
              v-for="s in STATUSES"
              :key="s.value"
              class="status-btn"
              :class="[
                s.value,
                { active: (progress?.status || 'unread') === s.value }
              ]"
              :title="s.label"
              @click="emit('update-status', s.value)"
            >
              <span class="sb-icon">{{ s.icon }}</span>
              <span class="sb-label">{{ s.label }}</span>
            </button>
          </div>
          <div class="nav-btns">
            <button class="nav-btn" @click="emit('prev-lesson')">‹ 上一节</button>
            <button class="nav-btn" @click="emit('next-lesson')">下一节 ›</button>
          </div>
        </div>
      </header>

      <!-- Summary -->
      <section v-if="lesson.summary" class="art-section">
        <h2 class="sec-title">摘要</h2>
        <p class="art-summary">{{ lesson.summary }}</p>
      </section>

      <!-- AI 精讲 -->
      <section v-if="lesson.deep_content" class="art-section">
        <h2 class="sec-title">
          <span class="sec-icon">✨</span>
          AI 精讲
        </h2>
        <div class="deep-content" v-html="renderMd(lesson.deep_content)"></div>
      </section>

      <!-- 代码示例 -->
      <section v-if="lesson.code_examples && lesson.code_examples.length" class="art-section">
        <h2 class="sec-title">
          <span class="sec-icon">💻</span>
          代码示例
          <span class="sec-count">{{ lesson.code_examples.length }}</span>
        </h2>
        <div class="code-list">
          <div v-for="(ce, i) in lesson.code_examples" :key="i" class="code-card">
            <div class="cc-head">
              <span class="cc-lang">{{ ce.language }}</span>
              <span class="cc-title">{{ ce.title }}</span>
            </div>
            <pre class="cc-code"><code>{{ ce.code }}</code></pre>
          </div>
        </div>
      </section>

      <!-- 练习 -->
      <section v-if="lesson.exercises && lesson.exercises.length" class="art-section">
        <h2 class="sec-title">
          <span class="sec-icon">📝</span>
          练习
          <span class="sec-count">{{ lesson.exercises.length }}</span>
        </h2>
        <div class="exer-list">
          <div v-for="(ex, i) in lesson.exercises" :key="i" class="exer-card">
            <div class="ex-q">
              <span class="ex-num">Q{{ i + 1 }}</span>
              {{ ex.question }}
            </div>
            <div v-if="ex.hint" class="ex-hint">💡 {{ ex.hint }}</div>
            <button class="ex-toggle" @click="toggleAnswer(i)">
              {{ expandedAnswers.has(i) ? '隐藏答案' : '查看答案' }}
            </button>
            <div v-if="expandedAnswers.has(i)" class="ex-answer">
              {{ ex.answer }}
            </div>
          </div>
        </div>
      </section>

      <!-- Key notes -->
      <section v-if="lesson.key_notes" class="art-section">
        <h2 class="sec-title">核心要点</h2>
        <div class="key-notes">{{ lesson.key_notes }}</div>
      </section>

      <!-- Materials -->
      <section v-if="lesson.materials?.length" class="art-section">
        <h2 class="sec-title">
          参考资料
          <span class="sec-count">{{ lesson.materials.length }}</span>
        </h2>
        <div class="materials-grid">
          <MaterialCard
            v-for="m in lesson.materials"
            :key="m.notion_id || m.url"
            :material="m"
          />
        </div>
      </section>

      <!-- No materials hint -->
      <section v-else class="art-section">
        <div class="no-materials">
          <span>📂 本节暂无关联资料</span>
        </div>
      </section>
      <!-- Review: Record outcome (SM-2) -->
      <section v-if="lesson" class="art-section review-outcomes">
        <h2 class="sec-title">
          <span class="sec-icon">🔁</span>
          间隔复习
          <span v-if="progress?.next_review" class="sec-count">下次 {{ progress.next_review }}</span>
        </h2>
        <div class="outcome-list">
          <button class="outcome-btn again" :disabled="recording" @click="recordReview('again')">
            <span class="ob-label">Again</span>
            <span class="ob-desc">完全忘记</span>
            <span class="ob-int">1 天后</span>
          </button>
          <button class="outcome-btn hard" :disabled="recording" @click="recordReview('hard')">
            <span class="ob-label">Hard</span>
            <span class="ob-desc">模糊</span>
            <span class="ob-int">1.2× 间隔</span>
          </button>
          <button class="outcome-btn good" :disabled="recording" @click="recordReview('good')">
            <span class="ob-label">Good</span>
            <span class="ob-desc">正确</span>
            <span class="ob-int">1.0× 间隔</span>
          </button>
          <button class="outcome-btn easy" :disabled="recording" @click="recordReview('easy')">
            <span class="ob-label">Easy</span>
            <span class="ob-desc">轻松</span>
            <span class="ob-int">1.3× 间隔</span>
          </button>
        </div>
      </section>
    </article>
  </div>
</template>

<style scoped>
.lesson-detail {
  flex: 1; overflow-y: auto;
  background: var(--bg-canvas);
  height: 100%;
}

/* Empty state */
.empty-state {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  height: 100%;
  gap: 12px; padding: 40px 20px;
}
.empty-icon { font-size: 56px; opacity: 0.4; }
.empty-title { font-size: 16px; color: var(--text-secondary); margin: 0; }
.empty-sub   { font-size: 13px; color: var(--text-quaternary); margin: 0; }

/* Article */
.article {
  max-width: 780px;
  margin: 0 auto;
  padding: 32px 36px 80px;
}

/* Header */
.art-head { margin-bottom: 28px; }

.art-breadcrumb {
  font-size: 11px; color: var(--text-quaternary);
  margin-bottom: 10px;
  display: flex; gap: 6px;
}
.art-breadcrumb .sep { opacity: 0.5; }
.art-breadcrumb .active { color: var(--text-secondary); }

.art-title {
  font-size: 24px; font-weight: 510;
  letter-spacing: -0.4px;
  color: var(--text-primary);
  margin: 0 0 14px 0;
  line-height: 1.3;
}

.art-tags {
  display: flex; flex-wrap: wrap; gap: 6px;
  margin-bottom: 16px;
}
.tag {
  font-size: 10px; padding: 2px 8px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  font-family: var(--font-mono);
}
.lvl-L1 { background: color-mix(in srgb, #4ade80 18%, transparent); color: #4ade80; }
.lvl-L2 { background: color-mix(in srgb, #fbbf24 18%, transparent); color: #fbbf24; }
.lvl-L3 { background: color-mix(in srgb, #f87171 18%, transparent); color: #f87171; }
.tag-neutral {
  background: var(--bg-panel);
  color: var(--text-tertiary);
  border: 1px solid var(--border-subtle);
}
.type-concept  { background: color-mix(in srgb, #7170ff 18%, transparent); color: #7170ff; }
.type-practice { background: color-mix(in srgb, #fb923c 18%, transparent); color: #fb923c; }
.type-case     { background: color-mix(in srgb, #a78bfa 18%, transparent); color: #a78bfa; }
.type-tool     { background: color-mix(in srgb, #94a3b8 18%, transparent); color: #94a3b8; }

/* Toolbar */
.art-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 12px;
  padding: 10px 0;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}

.status-switcher { display: flex; gap: 4px; }
.status-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
  color: var(--text-tertiary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}
.status-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}
.status-btn.active {
  background: color-mix(in srgb, var(--accent) 20%, transparent);
  border-color: var(--accent);
  color: var(--text-primary);
}
.status-btn.read.active     { color: #4ade80; border-color: #4ade80; }
.status-btn.reading.active  { color: #fbbf24; border-color: #fbbf24; }
.status-btn.review.active   { color: #f87171; border-color: #f87171; }
.status-btn.favorite.active { color: #fbbf24; border-color: #fbbf24; }

.sb-icon { font-size: 12px; }
.sb-label { font-size: 11px; }

.nav-btns { display: flex; gap: 6px; }
.nav-btn {
  padding: 5px 12px;
  background: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}
.nav-btn:hover {
  background: var(--bg-surface);
  border-color: var(--border-standard);
  color: var(--text-primary);
}

/* Sections */
.art-section { margin-top: 28px; }
.sec-title {
  font-size: 13px; font-weight: 510;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px 0;
  display: flex; align-items: center; gap: 8px;
}
.sec-count {
  font-size: 10px; padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: var(--bg-panel);
  color: var(--text-quaternary);
  font-family: var(--font-mono);
}

.art-summary {
  font-size: 14px;
  line-height: 1.75;
  color: var(--text-secondary);
  white-space: pre-line;
  margin: 0;
  padding: 14px 16px;
  background: var(--bg-panel);
  border-left: 3px solid var(--accent);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.key-notes {
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-secondary);
  padding: 14px 16px;
  background: color-mix(in srgb, #fbbf24 6%, var(--bg-panel));
  border-left: 3px solid #fbbf24;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  white-space: pre-line;
}

.materials-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
/* Review Outcomes */
.review-outcomes { border-top: 1px solid var(--border-subtle); padding-top: 20px; }
.outcome-list { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.outcome-btn {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 12px 8px; border-radius: 10px; border: 1px solid var(--border-subtle);
  background: var(--bg-panel); cursor: pointer; transition: all 0.15s;
  font-family: inherit; min-width: 0;
}
.outcome-btn:disabled { opacity: 0.5; cursor: default; }
.outcome-btn:not(:disabled):hover { border-color: var(--border-standard); transform: translateY(-1px); }
.outcome-btn.again:not(:disabled):hover { background: rgba(239,68,68,0.06); border-color: #ef4444; }
.outcome-btn.hard:not(:disabled):hover { background: rgba(245,158,11,0.06); border-color: #f59e0b; }
.outcome-btn.good:not(:disabled):hover { background: rgba(16,185,129,0.06); border-color: #10b981; }
.outcome-btn.easy:not(:disabled):hover { background: rgba(113,112,255,0.06); border-color: var(--accent); }
.ob-label { font-size: 13px; font-weight: 510; color: var(--text-primary); }
.ob-desc { font-size: 10px; color: var(--text-quaternary); }
.ob-int { font-size: 10px; font-family: var(--font-mono); color: var(--text-quaternary); }

@media (min-width: 900px) {
  .materials-grid { grid-template-columns: 1fr 1fr; }
}

/* AI 精讲 */
.sec-icon { font-size: 14px; }
.deep-content {
  font-size: 14px;
  line-height: 1.85;
  color: var(--text-secondary);
  padding: 16px 18px;
  background: linear-gradient(135deg, color-mix(in srgb, #7170ff 5%, var(--bg-panel)) 0%, var(--bg-panel) 60%);
  border-left: 3px solid #7170ff;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}
.deep-content :deep(strong) {
  color: var(--text-primary);
  font-weight: 510;
}

/* 代码示例 */
.code-list {
  display: flex; flex-direction: column; gap: 10px;
}
.code-card {
  background: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.cc-head {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}
.cc-lang {
  font-size: 10px; padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, #4ade80 18%, transparent);
  color: #4ade80;
  font-family: var(--font-mono);
  font-weight: 600;
}
.cc-title {
  font-size: 12px; color: var(--text-tertiary);
}
.cc-code {
  margin: 0;
  padding: 14px 16px;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.6;
  color: #d4d4d4;
  background: #1e1e1e;
  overflow-x: auto;
}

/* 练习 */
.exer-list {
  display: flex; flex-direction: column; gap: 10px;
}
.exer-card {
  padding: 14px 16px;
  background: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}
.ex-q {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.6;
  display: flex; gap: 8px;
  align-items: flex-start;
}
.ex-num {
  font-size: 10px; font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  color: var(--accent);
  font-family: var(--font-mono);
  flex-shrink: 0;
  margin-top: 2px;
}
.ex-hint {
  font-size: 12px;
  color: var(--text-quaternary);
  margin-top: 8px;
  padding-left: 28px;
  font-style: italic;
}
.ex-toggle {
  margin-top: 8px;
  margin-left: 28px;
  padding: 3px 10px;
  font-size: 11px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.15s;
}
.ex-toggle:hover {
  background: var(--bg-surface);
  color: var(--text-primary);
}
.ex-answer {
  margin-top: 8px;
  margin-left: 28px;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-secondary);
  background: color-mix(in srgb, #4ade80 6%, transparent);
  border-left: 2px solid #4ade80;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.no-materials {
  padding: 20px;
  text-align: center;
  color: var(--text-quaternary);
  font-size: 12px;
  background: var(--bg-panel);
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-subtle);
}

/* 移动端 */
@media (max-width: 768px) {
  .article {
    padding: 20px 16px 60px;
  }
  .art-title {
    font-size: 20px;
  }
  .art-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .status-switcher {
    justify-content: center;
    flex-wrap: wrap;
  }
  .nav-btns {
    justify-content: center;
  }
  .sb-label { display: none; }  /* 手机只显示图标 */
}
</style>
