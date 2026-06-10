<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Catalog, CourseMeta, Chapter } from '../composables/useCourses'
import ProgressRing from './ProgressRing.vue'

const props = defineProps<{
  catalog: Catalog | null
  courseMeta: CourseMeta | null          // 当前选中课程的 meta（含 chapters 列表）
  chapters: Chapter[]                     // 当前课程的章节内容（含 lessons）
  selectedCourseId: string | null
  selectedChapterId: string | null
  selectedLessonId: string | null
  courseProgress: Record<string, number>  // courseId → 已读课时百分比
}>()

const emit = defineEmits<{
  (e: 'select-course', id: string): void
  (e: 'select-lesson', courseId: string, chapterId: string, lessonId: string): void
  (e: 'back-to-dashboard'): void
}>()

const expandedCourses = ref<Set<string>>(new Set())
const expandedChapters = ref<Set<string>>(new Set())
const search = ref('')

function toggleCourse(id: string) {
  if (expandedCourses.value.has(id)) {
    expandedCourses.value.delete(id)
  } else {
    expandedCourses.value.add(id)
  }
}

function toggleChapter(id: string) {
  if (expandedChapters.value.has(id)) {
    expandedChapters.value.delete(id)
  } else {
    expandedChapters.value.add(id)
  }
}

function handleCourseClick(id: string) {
  if (expandedCourses.value.has(id)) {
    // If already expanded, collapse it
    expandedCourses.value.delete(id)
  } else {
    // Expand and select
    emit('select-course', id)
    expandedCourses.value.add(id)
  }
}

const filteredCourses = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q || !props.catalog) return props.catalog?.courses ?? []
  return props.catalog.courses.filter(c =>
    c.title.toLowerCase().includes(q) ||
    c.description?.toLowerCase().includes(q) ||
    c.tags?.some(t => t.toLowerCase().includes(q))
  )
})

function lessonStatus(courseId: string, lessonId: string): string {
  // 通过 props.courseProgress 仅能拿到课程级别，详细状态由父组件传入的 chapters 中读取
  // 这里父组件已绑定 chapters 为当前选中课程的全部章节，
  // 对于非当前课程的课时状态不展示，仅展示当前选中课程
  if (courseId !== props.selectedCourseId) return 'unread'
  for (const ch of props.chapters) {
    const found = ch.lessons?.find(l => l.lesson_id === lessonId)
    if (found && (found as any).status) return (found as any).status
  }
  return 'unread'
}

const STATUS_ICON: Record<string, string> = {
  unread: '○',
  reading: '◐',
  read: '●',
  review: '↻',
  favorite: '★',
}
</script>

<template>
  <aside class="course-tree">
    <!-- 顶部：返回仪表盘 + 搜索 -->
    <div class="tree-head">
      <button class="back-btn" @click="emit('back-to-dashboard')">
        <span class="back-icon">←</span>
        <span>仪表盘</span>
      </button>
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input v-model="search" placeholder="搜索课程..." class="search-input" />
      </div>
    </div>

    <!-- 课程列表 -->
    <div class="tree-list">
      <div v-if="!catalog" class="tree-empty">
        <span class="loading-spinner">⟳</span>
        <p>加载中...</p>
      </div>

      <div v-else-if="filteredCourses.length === 0" class="tree-empty">
        <p>无匹配课程</p>
      </div>

      <div v-else>
        <div v-for="course in filteredCourses" :key="course.id" class="course-node">
          <!-- 课程行 -->
          <div
            class="course-row"
            :class="{ active: selectedCourseId === course.id }"
            @click="handleCourseClick(course.id)"
          >
            <span
              class="expand-icon"
              :class="{ expanded: expandedCourses.has(course.id) }"
              @click.stop="toggleCourse(course.id)"
            >▸</span>
            <span class="course-emoji">{{ course.emoji || course.cover_emoji || '📚' }}</span>
            <div class="course-info">
              <div class="course-title">{{ course.title }}</div>
              <div class="course-meta">
                {{ course.material_count }} 篇 · {{ course.chapter_count }} 章
              </div>
            </div>
            <ProgressRing
              v-if="courseProgress[course.id] > 0"
              :percent="courseProgress[course.id]"
              :size="20"
              :stroke="2"
            />
          </div>

          <!-- 章节列表（点击课程行展开/收缩） -->
          <div
            v-if="expandedCourses.has(course.id) && selectedCourseId === course.id && courseMeta"
            class="chapter-list"
          >
            <div
              v-for="ch in courseMeta.chapters"
              :key="ch.id"
              class="chapter-node"
            >
              <div
                class="chapter-title"
                @click="toggleChapter(ch.id)"
                :class="{ expanded: expandedChapters.has(ch.id) }"
              >
                <span class="expand-icon" :class="{ expanded: expandedChapters.has(ch.id) }">▸</span>
                <span class="chapter-tag">{{ ch.id.replace(/^0+/, '') || '0' }}</span>
                <span>{{ ch.title }}</span>
                <span class="chapter-count">{{ ch.lesson_count || (chapters.find(c => c.chapter_id === ch.id)?.lessons ?? []).length }} 节</span>
              </div>
              <div
                v-for="lesson in (expandedChapters.has(ch.id) ? (chapters.find(c => c.chapter_id === ch.id)?.lessons ?? []) : [])"
                :key="lesson.lesson_id"
                class="lesson-row"
                :class="{ active: selectedLessonId === lesson.lesson_id }"
                @click="emit('select-lesson', course.id, ch.id, lesson.lesson_id)"
              >
                <span class="lesson-status" :class="lessonStatus(course.id, lesson.lesson_id)">
                  {{ STATUS_ICON[lessonStatus(course.id, lesson.lesson_id)] }}
                </span>
                <span class="lesson-level" :class="'lvl-' + (lesson.level || 'L1')">
                  {{ lesson.level || 'L1' }}
                </span>
                <span class="lesson-title">{{ lesson.title }}</span>
              </div>
            </div>
          </div>
          <div
            v-else-if="expandedCourses.has(course.id) && selectedCourseId !== course.id"
            class="chapter-hint"
          >
            点击课程加载章节
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.course-tree {
  width: 280px; flex-shrink: 0;
  display: flex; flex-direction: column;
  border-right: 1px solid var(--border-subtle);
  background: var(--bg-panel);
  height: 100%;
}

/* Head */
.tree-head {
  padding: 12px;
  display: flex; flex-direction: column; gap: 10px;
  border-bottom: 1px solid var(--border-subtle);
}
.back-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 12px; cursor: pointer;
  transition: all 0.15s;
}
.back-btn:hover {
  background: var(--hover-bg);
  border-color: var(--border-standard);
  color: var(--text-primary);
}
.back-icon { font-size: 13px; }

.search-box {
  position: relative;
  display: flex; align-items: center;
}
.search-icon {
  position: absolute; left: 8px;
  font-size: 11px; color: var(--text-quaternary);
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 6px 8px 6px 26px;
  background: var(--bg-canvas);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s;
}
.search-input:focus { border-color: var(--accent); }
.search-input::placeholder { color: var(--text-quaternary); }

/* List */
.tree-list {
  flex: 1; overflow-y: auto;
  padding: 8px 6px;
}

/* Course row */
.course-node { margin-bottom: 2px; }
.course-row {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 8px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.12s;
}
.course-row:hover { background: var(--hover-bg); }
.course-row.active {
  background: color-mix(in srgb, var(--accent) 18%, transparent);
}
.course-row.active .course-title { color: var(--text-primary); }

.expand-icon {
  font-size: 9px; color: var(--text-quaternary);
  width: 12px; flex-shrink: 0;
  text-align: center;
  transition: transform 0.15s;
  cursor: pointer;
}
.expand-icon:hover { color: var(--text-secondary); }
.expand-icon.expanded { transform: rotate(90deg); }

.course-emoji {
  font-size: 16px; flex-shrink: 0;
  width: 22px; text-align: center;
}
.course-info { flex: 1; min-width: 0; }
.course-title {
  font-size: 12.5px; font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.course-meta {
  font-size: 10px; color: var(--text-quaternary);
  font-family: var(--font-mono);
  margin-top: 1px;
}

/* Chapter */
.chapter-list {
  padding: 2px 0 6px 26px;
}
.chapter-hint {
  padding: 4px 0 4px 26px;
  font-size: 10px; color: var(--text-quaternary);
  font-style: italic;
}

.chapter-node { margin: 4px 0; }
.chapter-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 500;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding: 4px 6px;
  border-bottom: 1px solid var(--border-subtle);
}
.chapter-tag {
  font-family: var(--font-mono);
  color: var(--text-quaternary);
  font-size: 10px;
}

/* Lesson */
.lesson-row {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 8px;
  border-radius: var(--radius-sm);
  font-size: 11.5px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.12s;
}
.lesson-row:hover { background: var(--hover-bg); }
.lesson-row.active {
  background: color-mix(in srgb, var(--accent) 25%, transparent);
  color: var(--text-primary);
}
.lesson-title {
  flex: 1; min-width: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.lesson-status {
  font-size: 10px;
  width: 12px; flex-shrink: 0;
  text-align: center;
  color: var(--text-quaternary);
}
.lesson-status.read { color: var(--status-online); }
.lesson-status.reading { color: #fbbf24; }
.lesson-status.review { color: #f87171; }
.lesson-status.favorite { color: #fbbf24; }

.lesson-level {
  font-size: 9px; padding: 0 4px;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-weight: 600;
  flex-shrink: 0;
}
.lvl-L1 { background: color-mix(in srgb, #4ade80 18%, transparent); color: #4ade80; }
.lvl-L2 { background: color-mix(in srgb, #fbbf24 18%, transparent); color: #fbbf24; }
.lvl-L3 { background: color-mix(in srgb, #f87171 18%, transparent); color: #f87171; }

/* Empty */
.tree-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 32px 12px;
  color: var(--text-quaternary);
  font-size: 12px;
}
.loading-spinner {
  font-size: 22px;
  animation: spin 1s linear infinite;
}
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
