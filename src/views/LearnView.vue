<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCourses, type Catalog, type CourseMeta, type Chapter, type Lesson, type Progress, type LessonProgress, type Dashboard, type ReviewDue } from '../composables/useCourses'
import CourseTree from '../components/CourseTree.vue'
import LessonDetail from '../components/LessonDetail.vue'
import LearnDashboard from '../components/LearnDashboard.vue'

const route = useRoute()
const router = useRouter()
const { fetchCatalog, fetchCourse, fetchDashboard, fetchReviewDue, updateProgress, loading, error } = useCourses()

/* ── State ── */
const catalog = ref<Catalog | null>(null)
const dashboard = ref<Dashboard | null>(null)
const reviewDue = ref<ReviewDue | null>(null)
const courseMeta = ref<CourseMeta | null>(null)
const chapters = ref<Chapter[]>([])
const progress = ref<Progress | null>(null)

const selectedCourseId = ref<string | null>(null)
const selectedChapterId = ref<string | null>(null)
const selectedLessonId = ref<string | null>(null)

// 视图模式：'dashboard' 首屏仪表盘 / 'course' 浏览课程
const viewMode = ref<'dashboard' | 'course'>('dashboard')
// 手机端目录树抽屉
const treeOpen = ref(false)

/* ── Computed ── */
const currentLesson = computed<Lesson | null>(() => {
  if (!selectedLessonId.value) return null
  for (const ch of chapters.value) {
    const found = ch.lessons?.find(l => l.lesson_id === selectedLessonId.value)
    if (found) return found
  }
  return null
})

const currentChapter = computed<Chapter | null>(() => {
  if (!selectedChapterId.value) return null
  return chapters.value.find(c => c.chapter_id === selectedChapterId.value) || null
})

const currentLessonProgress = computed(() => {
  if (!selectedLessonId.value || !progress.value) return null
  return progress.value.lessons[selectedLessonId.value] || null
})

// 各课程已读百分比（仪表盘 + 树用）
const courseProgress = computed<Record<string, number>>(() => {
  if (!dashboard.value) return {}
  const map: Record<string, number> = {}
  for (const c of dashboard.value.courses_progress) {
    map[c.id] = c.percent
  }
  return map
})

/* ── 数据加载 ── */
async function loadCatalog() {
  catalog.value = await fetchCatalog()
}

async function loadDashboard() {
  dashboard.value = await fetchDashboard()
  reviewDue.value = await fetchReviewDue()
}

async function loadCourse(id: string) {
  const data = await fetchCourse(id)
  if (!data) return
  courseMeta.value = {
    id: data.id,
    title: data.title,
    emoji: data.emoji,
    cover_emoji: data.cover_emoji,
    description: data.description,
    material_count: data.material_count,
    chapter_count: data.chapter_count,
    difficulty_range: data.difficulty_range,
    estimated_hours: data.estimated_hours,
    tags: data.tags,
    notion_category: data.notion_category,
    created_at: data.created_at,
    chapters: data.chapters.map(c => ({
      id: c.chapter_id,
      title: c.title,
      level: c.level,
      lesson_count: c.lessons?.length,
    })),
  }
  chapters.value = data.chapters
  progress.value = data.progress
}

/* ── URL 同步 ── */
function syncUrl() {
  const q: Record<string, string> = {}
  if (selectedCourseId.value) q.course = selectedCourseId.value
  if (selectedChapterId.value) q.chapter = selectedChapterId.value
  if (selectedLessonId.value) q.lesson = selectedLessonId.value
  router.replace({ query: q })
}

function readUrl() {
  const q = route.query
  if (q.course && typeof q.course === 'string') {
    selectedCourseId.value = q.course
    viewMode.value = 'course'
  }
  if (q.chapter && typeof q.chapter === 'string') {
    selectedChapterId.value = q.chapter
  }
  if (q.lesson && typeof q.lesson === 'string') {
    selectedLessonId.value = q.lesson
  }
}

/* ── 事件处理 ── */
async function onSelectCourse(id: string) {
  if (selectedCourseId.value !== id) {
    selectedCourseId.value = id
    selectedChapterId.value = null
    selectedLessonId.value = null
    viewMode.value = 'course'
    await loadCourse(id)
    // 自动选中第一章第一节
    if (chapters.value.length > 0 && chapters.value[0].lessons?.length) {
      selectedChapterId.value = chapters.value[0].chapter_id
      selectedLessonId.value = chapters.value[0].lessons[0].lesson_id
    }
    syncUrl()
  }
}

function onSelectLesson(courseId: string, chapterId: string, lessonId: string) {
  selectedCourseId.value = courseId
  selectedChapterId.value = chapterId
  selectedLessonId.value = lessonId
  viewMode.value = 'course'
  // 自动标记为在读（如未读）
  if (!progress.value?.lessons[lessonId]) {
    onUpdateStatus('reading')
  }
  syncUrl()
}

async function onUpdateStatus(status: LessonProgress['status']) {
  if (!selectedCourseId.value || !selectedLessonId.value) return
  const updated = await updateProgress(selectedCourseId.value, selectedLessonId.value, status)
  if (updated) {
    progress.value = updated
  }
  // 刷新仪表盘缓存（异步，不阻塞）
  loadDashboard()
}

function onPrevLesson() {
  if (!selectedLessonId.value) return
  const flat: { chapterId: string; lessonId: string }[] = []
  for (const ch of chapters.value) {
    for (const l of ch.lessons || []) {
      flat.push({ chapterId: ch.chapter_id, lessonId: l.lesson_id })
    }
  }
  const idx = flat.findIndex(x => x.lessonId === selectedLessonId.value)
  if (idx > 0) {
    selectedChapterId.value = flat[idx - 1].chapterId
    selectedLessonId.value = flat[idx - 1].lessonId
    syncUrl()
  }
}

function onNextLesson() {
  if (!selectedLessonId.value) return
  const flat: { chapterId: string; lessonId: string }[] = []
  for (const ch of chapters.value) {
    for (const l of ch.lessons || []) {
      flat.push({ chapterId: ch.chapter_id, lessonId: l.lesson_id })
    }
  }
  const idx = flat.findIndex(x => x.lessonId === selectedLessonId.value)
  if (idx >= 0 && idx < flat.length - 1) {
    selectedChapterId.value = flat[idx + 1].chapterId
    selectedLessonId.value = flat[idx + 1].lessonId
    syncUrl()
  }
}

function onBackToDashboard() {
  viewMode.value = 'dashboard'
  selectedCourseId.value = null
  selectedChapterId.value = null
  selectedLessonId.value = null
  syncUrl()
  loadDashboard()
}

/* ── 初始化 ── */
onMounted(async () => {
  readUrl()
  await Promise.all([loadCatalog(), loadDashboard()])
  // 若 URL 带了 course 参数，加载该课程
  if (selectedCourseId.value) {
    await loadCourse(selectedCourseId.value)
    if (selectedLessonId.value && !progress.value?.lessons[selectedLessonId.value]) {
      onUpdateStatus('reading')
    }
  }
})

/* 监听路由外部变化（如侧边栏跳转） */
watch(() => route.query, () => {
  readUrl()
})
</script>

<template>
  <div class="learn">
    <!-- 顶栏 -->
    <header class="learn-head">
      <h1 class="page-title">Learning Center</h1>
      <p class="page-subtitle">
        {{ viewMode === 'dashboard'
          ? `${catalog?.total_courses ?? 0} courses · ${catalog?.total_materials ?? 0} materials · ${reviewDue?.total ?? 0} reviews due`
          : courseMeta?.title || ''
        }}
      </p>
    </header>

    <!-- 错误态 -->
    <div v-if="error" class="error-banner">
      <span>⚠️</span> {{ error }}
    </div>

    <!-- 主体：两种模式 -->
    <!-- 模式 1：仪表盘首屏 -->
    <main v-if="viewMode === 'dashboard'" class="learn-body dashboard-mode">
      <LearnDashboard
        :dashboard="dashboard"
        :catalog="catalog"
        :review-due="reviewDue"
        @select-course="onSelectCourse"
        @select-lesson="onSelectLesson"
      />
    </main>

    <!-- 模式 2：课程浏览（左树 + 右详情） -->
    <main v-else class="learn-body course-mode">
      <!-- 手机端：树抽屉按钮 -->
      <button
        v-if="!treeOpen"
        class="tree-toggle-mobile"
        @click="treeOpen = true"
        aria-label="打开目录"
      >☰</button>
      <div
        v-if="treeOpen"
        class="tree-backdrop-mobile"
        @click="treeOpen = false"
      />
      <CourseTree
        :class="{ 'tree-open-mobile': treeOpen }"
        :catalog="catalog"
        :course-meta="courseMeta"
        :chapters="chapters"
        :selected-course-id="selectedCourseId"
        :selected-chapter-id="selectedChapterId"
        :selected-lesson-id="selectedLessonId"
        :course-progress="courseProgress"
        @select-course="(id) => { onSelectCourse(id); treeOpen = false }"
        @select-lesson="(cid, chid, lid) => { onSelectLesson(cid, chid, lid); treeOpen = false }"
        @back-to-dashboard="onBackToDashboard"
      />
      <LessonDetail
        :lesson="currentLesson"
        :chapter="currentChapter"
        :progress="currentLessonProgress"
        :course-id="selectedCourseId"
        @update-status="onUpdateStatus"
        @prev-lesson="onPrevLesson"
        @next-lesson="onNextLesson"
      />
    </main>
  </div>
</template>

<style scoped>
.learn {
  display: flex; flex-direction: column;
  height: 100%;
  min-height: 0;
}

.learn-head {
  padding: 0 32px;
  padding-top: 8px;
  flex-shrink: 0;
}
.page-title {
  font-size: 28px;
  font-weight: 510;
  letter-spacing: -0.6px;
  color: var(--text-primary);
  margin: 0;
}
.page-subtitle {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 4px 0 0 0;
}

.error-banner {
  margin: 16px 32px;
  padding: 10px 14px;
  background: color-mix(in srgb, #ef4444 12%, var(--bg-panel));
  border: 1px solid color-mix(in srgb, #ef4444 30%, transparent);
  border-radius: var(--radius-md);
  color: #fca5a5;
  font-size: 13px;
}

.learn-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Dashboard mode */
.dashboard-mode {
  overflow-y: auto;
  padding: 0 32px;
}

/* Course mode: tree + detail */
.course-mode {
  display: flex;
  align-items: stretch;
}

/* Loading overlay */
.learn :deep(.loading-spinner) {
  display: inline-block;
}

/* ── 移动端（≤768px） ── */
@media (max-width: 768px) {
  .learn-head { padding: 0 16px; padding-top: 8px; }
  .page-title { font-size: 22px; }
  .dashboard-mode { padding: 0 16px; }
  
  /* 树抽屉 */
  .course-mode {
    flex-direction: column;
    position: relative;
  }
  .tree-toggle-mobile {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 50;
    width: 48px; height: 48px;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
    border: none;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    font-size: 20px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
  }
  .tree-toggle-mobile:hover {
    background: var(--accent-hover);
  }
  .tree-backdrop-mobile {
    position: fixed; inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 40;
  }
  /* CourseTree 在手机上变成抽屉 */
  .learn :deep(.course-tree) {
    position: fixed;
    top: 0; left: 0;
    height: 100vh;
    width: 280px;
    z-index: 60;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.5);
  }
  .learn :deep(.course-tree.tree-open-mobile) {
    transform: translateX(0);
  }
}
@media (min-width: 769px) {
  /* 桌面端隐藏抽屉控件 */
  .tree-toggle-mobile,
  .tree-backdrop-mobile {
    display: none !important;
  }
}
</style>
