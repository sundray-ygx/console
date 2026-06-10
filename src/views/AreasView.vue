<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAreas } from '../composables/useAreas'
import { useAreaCourses, type AreaCourseGroup } from '../composables/useAreaCourses'
import { useBooks, type Book } from '../composables/useBooks'
import CourseReader from '../components/CourseReader.vue'

const router = useRouter()
const { areas, loading, error, fetchAreas } = useAreas()
const { fetchGroupedCourses, fetchCourseBooks, loading: courseLoading } = useAreaCourses()
const { indexBooks, searchBooks, getRecentBooks } = useBooks()

/* ── Tab State ── */
const activeTab = ref<'overview' | 'courses' | 'books'>('overview')

/* ── Overview Tab State ── */
// 课程分组数据用于在概览中显示各领域的课程数
const courseGroups = ref<AreaCourseGroup[]>([])
const expandedArea = ref<string | null>(null)

/* ── Course Tab State ── */
const selectedArea = ref<string | null>(null)
const expandedCourse = ref<string | null>(null)
const courseBooks = ref<Record<string, any[]>>({})
const loadingCourseBooks = ref(false)

/* ── Books Tab State ── */
const allBooks = ref<Book[]>([])
const searchQuery = ref('')
const searchResults = ref<Book[]>([])
const selectedBook = ref<Book | null>(null)
const loadingBooks = ref(false)

/* ── Computed ── */
const areaCourseMap = computed(() => {
  const map: Record<string, number> = {}
  for (const g of courseGroups.value) {
    map[g.area_id] = g.courses.length
  }
  return map
})

const areasWithCourses = computed(() => {
  return areas.value.filter(a => areaCourseMap.value[a.id] > 0)
})

/* ── Methods ── */
function toggleArea(areaId: string) {
  expandedArea.value = expandedArea.value === areaId ? null : areaId
}

function selectArea(areaId: string) {
  selectedArea.value = selectedArea.value === areaId ? null : areaId
}

async function toggleCourse(courseId: string) {
  if (expandedCourse.value === courseId) {
    expandedCourse.value = null
    return
  }
  expandedCourse.value = courseId
  loadingCourseBooks.value = true
  try {
    const books = await fetchCourseBooks(courseId)
    courseBooks.value[courseId] = books
  } finally {
    loadingCourseBooks.value = false
  }
}

async function triggerIndex() {
  loadingBooks.value = true
  try {
    await indexBooks()
    allBooks.value = await getRecentBooks(50)
  } finally {
    loadingBooks.value = false
  }
}

async function loadAllBooks() {
  loadingBooks.value = true
  try {
    allBooks.value = await getRecentBooks(50)
  } finally {
    loadingBooks.value = false
  }
}

async function handleSearch() {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  loadingBooks.value = true
  try {
    searchResults.value = await searchBooks(searchQuery.value, 20)
  } finally {
    loadingBooks.value = false
  }
}

function openBook(book: Book) {
  selectedBook.value = book
}

function closeReader() {
  selectedBook.value = null
}

function handleChildClick(child: { id: string; type: string }) {
  if (child.type === 'course') {
    router.push(`/learn?course=${encodeURIComponent(child.id)}`)
  }
}

onMounted(async () => {
  fetchAreas()
  // Load course groups
  courseGroups.value = await fetchGroupedCourses()
  // Load books
  await loadAllBooks()
})
</script>

<template>
  <div class="areas">
    <!-- Course Reader Modal -->
    <div v-if="selectedBook" class="reader-modal">
      <div class="modal-backdrop" @click="closeReader"></div>
      <div class="modal-content">
        <CourseReader :book="selectedBook" @close="closeReader" />
      </div>
    </div>

    <h1 class="page-title" style="margin-bottom:4px">Areas</h1>
    <p class="page-subtitle" style="font-size:14px;color:var(--text-tertiary);margin-bottom:24px">
      Life responsibilities grouped by domain — each area contains related resources and courses
    </p>

    <!-- ── Tab Navigation ── -->
    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">
        📂 概览
      </button>
      <button class="tab" :class="{ active: activeTab === 'courses' }" @click="activeTab = 'courses'">
        📚 课程 ({{ courseGroups.length }} 领域)
      </button>
      <button class="tab" :class="{ active: activeTab === 'books' }" @click="activeTab = 'books'">
        📖 书籍 ({{ allBooks.length }})
      </button>
    </div>

    <!-- ════════════════════════ Tab: 概览 ════════════════════════ -->
    <div v-if="activeTab === 'overview'" class="tab-panel">
      <!-- 领域概览卡片 -->
      <div v-if="loading && areas.length === 0" class="empty-state">
        <span class="loading-spinner">⟳</span>
        <p>Loading areas...</p>
      </div>
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
      </div>
      <div v-else-if="areas.length === 0" class="empty-state">
        <span class="empty-icon">📂</span>
        <p>No areas yet</p>
      </div>
      <div v-else class="areas-grid">
        <div v-for="area in areas" :key="area.id" class="area-card" @click="toggleArea(area.id)">
          <div class="area-header">
            <span class="area-icon">{{ area.icon }}</span>
            <div class="area-meta">
              <h2 class="area-name">{{ area.name }}</h2>
              <div class="area-stats">
                <span class="stat-badge" v-if="areaCourseMap[area.id]">
                  📚 {{ areaCourseMap[area.id] }} 门课程
                </span>
                <span class="area-source">{{ area.source }}</span>
              </div>
            </div>
            <span class="area-count">{{ area.itemCount }}</span>
            <span class="expand-icon" :class="{ open: expandedArea === area.id }">▶</span>
          </div>

          <!-- 展开：该领域的课程 -->
          <div v-if="expandedArea === area.id" class="area-detail">
            <div v-if="areaCourseMap[area.id]" class="area-courses-mini">
              <div v-for="g in courseGroups.filter(g => g.area_id === area.id)" :key="g.area_id" class="area-course-list">
                <div v-for="c in g.courses" :key="c.id" class="mini-course-item" @click.stop="router.push(`/learn?course=${encodeURIComponent(c.id)}`)">
                  <span class="course-emoji">{{ c.emoji }}</span>
                  <span class="course-title">{{ c.title }}</span>
                  <span class="course-meta">{{ c.book_count }} 书 • {{ c.material_count }} 材料</span>
                </div>
              </div>
            </div>
            <div v-else>
              <div v-if="area.children.length > 0" class="area-children">
                <div v-for="child in area.children" :key="child.id" class="child-item" @click.stop="handleChildClick(child)">
                  <span class="child-type">{{ child.type }}</span>
                  <span class="child-name">{{ child.name }}</span>
                  <span class="child-count">{{ child.count }}</span>
                </div>
              </div>
              <div v-else class="area-empty">暂无关联资源</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ════════════════════════ Tab: 📚 课程 ════════════════════════ -->
    <div v-else-if="activeTab === 'courses'" class="tab-panel">
      <!-- 领域过滤器 -->
      <div class="filter-bar">
        <button class="filter-btn" :class="{ active: selectedArea === null }" @click="selectedArea = null">
          全部领域
        </button>
        <button
          v-for="area in areasWithCourses"
          :key="area.id"
          class="filter-btn"
          :class="{ active: selectedArea === area.id }"
          @click="selectArea(area.id)"
        >
          {{ area.icon }} {{ area.name }}
        </button>
      </div>

      <!-- 课程列表（按领域分组） -->
      <div v-if="courseLoading" class="empty-state">
        <span class="loading-spinner">⟳</span>
      </div>
      <div v-else-if="courseGroups.length === 0" class="empty-state">
        <span class="empty-icon">📚</span>
        <p>暂无课程数据。请先运行扫描导入课程</p>
      </div>
      <div v-else class="courses-content">
        <div
          v-for="g in courseGroups.filter(g => !selectedArea || g.area_id === selectedArea)"
          :key="g.area_id"
          class="area-course-group"
        >
          <h3 class="area-group-title">{{ g.area_id.replace('area-', '') }} ({{ g.courses.length }} 门课程)</h3>
          <div class="course-cards">
            <div
              v-for="c in g.courses"
              :key="c.id"
              class="course-card"
              @click="toggleCourse(c.id)"
            >
              <div class="course-card-header">
                <span class="course-card-emoji">{{ c.emoji }}</span>
                <div class="course-card-info">
                  <h4 class="course-card-title">{{ c.title }}</h4>
                  <p class="course-card-desc">{{ c.description }}</p>
                </div>
                <span class="course-card-meta">{{ c.book_count }} 📕 {{ c.material_count }} 🔗</span>
                <span class="expand-icon" :class="{ open: expandedCourse === c.id }">▶</span>
              </div>

              <!-- 展开：课程详情 -->
              <div v-if="expandedCourse === c.id" class="course-detail">
                <div v-if="loadingCourseBooks" class="loading-mini">
                  <span class="loading-spinner-small">⟳</span>
                  <span>加载书籍中...</span>
                </div>
                <div v-else-if="courseBooks[c.id] && courseBooks[c.id].length > 0" class="course-books">
                  <h5 class="detail-section-title">📖 关联书籍</h5>
                  <div class="books-list">
                    <div
                      v-for="book in courseBooks[c.id]"
                      :key="book.id"
                      class="book-row"
                      @click.stop="openBook(book)"
                    >
                      <span class="book-row-icon">📕</span>
                      <span class="book-row-title">{{ book.title }}</span>
                      <span class="book-row-format">{{ book.file_type?.toUpperCase() }}</span>
                    </div>
                  </div>
                </div>
                <div v-else class="empty-detail">
                  <span>暂无关联书籍</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ════════════════════════ Tab: 📖 书籍 ════════════════════════ -->
    <div v-else-if="activeTab === 'books'" class="tab-panel">
      <!-- 搜索 + 扫描 -->
      <div class="search-section">
        <input
          type="text"
          class="search-input"
          v-model="searchQuery"
          placeholder="搜索所有书籍..."
          @input="handleSearch"
        />
        <button class="index-btn" @click="triggerIndex" :disabled="loadingBooks">
          🔄 扫描 NAS 书籍
        </button>
      </div>

      <!-- 搜索结果 -->
      <div v-if="searchResults.length > 0" class="books-section">
        <h3 class="section-title">🔍 搜索结果 ({{ searchResults.length }})</h3>
        <div class="books-grid">
          <div v-for="book in searchResults" :key="book.id" class="book-card" @click="openBook(book)">
            <span class="book-icon">📕</span>
            <div class="book-info">
              <h4 class="book-title">{{ book.title }}</h4>
              <span class="book-format">{{ book.file_type?.toUpperCase() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 全部书籍 -->
      <div class="books-section">
        <h3 class="section-title">📖 全部书籍 ({{ allBooks.length }})</h3>
        <div v-if="loadingBooks" class="loading-state mini">
          <span class="loading-spinner">⟳</span>
        </div>
        <div v-else-if="allBooks.length === 0" class="empty-state">
          <span class="empty-icon">📚</span>
          <p>暂无书籍。点击"扫描 NAS 书籍"开始索引</p>
        </div>
        <div v-else class="books-grid">
          <div v-for="book in allBooks" :key="book.id" class="book-card" @click="openBook(book)">
            <span class="book-icon">📕</span>
            <div class="book-info">
              <h4 class="book-title">{{ book.title }}</h4>
              <span class="book-format">{{ book.file_type?.toUpperCase() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.areas { padding-top: 32px; }

/* ── Tabs ── */
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border-subtle);
}
.tab {
  padding: 10px 20px;
  border: none;
  background: none;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 14px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}
.tab:hover { color: var(--text-primary); }
.tab.active { color: var(--accent); border-bottom-color: var(--accent); }

.tab-panel { min-height: 200px; }

/* ── States ── */
.loading-state, .error-state, .empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 60px 20px; color: var(--text-tertiary);
}
.loading-state.mini { padding: 30px 20px; }
.loading-spinner { font-size: 32px; animation: spin 1s linear infinite; }
.loading-spinner-small { font-size: 16px; animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.error-icon, .empty-icon { font-size: 32px; }
.loading-mini { display: flex; align-items: center; gap: 8px; padding: 20px; color: var(--text-quaternary); font-size: 13px; }

/* ── Overview: Areas Grid ── */
.areas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 14px; }
.area-card { border: 1px solid var(--border-subtle); border-radius: 12px; background: var(--bg-surface); overflow: hidden; cursor: pointer; transition: border-color 0.15s; }
.area-card:hover { border-color: var(--border-standard); }
.area-header { display: flex; align-items: center; gap: 12px; padding: 16px; border-bottom: 1px solid var(--border-subtle); }
.area-icon { font-size: 24px; }
.area-meta { flex: 1; min-width: 0; }
.area-name { font-size: 16px; font-weight: 510; color: var(--text-primary); margin: 0; }
.area-stats { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.stat-badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); }
.area-source { font-size: 11px; color: var(--text-quaternary); font-family: var(--font-mono); }
.area-count { font-size: 14px; font-family: var(--font-mono); color: var(--text-quaternary); background: var(--bg-canvas); padding: 2px 8px; border-radius: 6px; }
.expand-icon { font-size: 10px; color: var(--text-quaternary); transition: transform 0.2s; }
.expand-icon.open { transform: rotate(90deg); }
.area-detail { padding: 12px 16px; }
.area-children { display: flex; flex-direction: column; gap: 6px; }
.child-item {
  display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px;
  background: var(--bg-panel); border: 1px solid var(--border-subtle);
  cursor: pointer; transition: all 0.12s;
}
.child-item:hover { border-color: var(--border-standard); background: var(--bg-canvas); }
.child-type { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); flex-shrink: 0; }
.child-name { flex: 1; font-size: 13px; color: var(--text-secondary); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.child-count { font-size: 11px; font-family: var(--font-mono); color: var(--text-quaternary); }
.area-empty { padding: 20px; text-align: center; font-size: 12px; color: var(--text-quaternary); }

/* Mini course list in overview */
.area-course-list { display: flex; flex-direction: column; gap: 4px; }
.mini-course-item {
  display: flex; align-items: center; gap: 10px; padding: 8px 10px;
  border-radius: 8px; background: var(--bg-panel); border: 1px solid var(--border-subtle);
  cursor: pointer; transition: all 0.12s;
}
.mini-course-item:hover { border-color: var(--accent); }
.course-emoji { font-size: 16px; }
.course-title { flex: 1; font-size: 13px; color: var(--text-primary); }
.course-meta { font-size: 11px; color: var(--text-quaternary); }

/* ── Courses Tab ── */
.filter-bar {
  display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;
}
.filter-btn {
  padding: 6px 14px; border: 1px solid var(--border-subtle); border-radius: 20px;
  background: var(--bg-surface); color: var(--text-secondary); cursor: pointer;
  font-size: 12px; transition: all 0.15s;
}
.filter-btn:hover { border-color: var(--accent); color: var(--accent); }
.filter-btn.active { background: var(--accent); color: white; border-color: var(--accent); }

.courses-content { display: flex; flex-direction: column; gap: 24px; }
.area-course-group { }
.area-group-title { font-size: 14px; font-weight: 510; color: var(--text-primary); margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px; }

.course-cards { display: flex; flex-direction: column; gap: 8px; }
.course-card {
  border: 1px solid var(--border-subtle); border-radius: 10px; background: var(--bg-surface);
  overflow: hidden; cursor: pointer; transition: border-color 0.15s;
}
.course-card:hover { border-color: var(--border-standard); }
.course-card-header {
  display: flex; align-items: center; gap: 12px; padding: 14px 16px;
}
.course-card-emoji { font-size: 24px; }
.course-card-info { flex: 1; min-width: 0; }
.course-card-title { font-size: 14px; font-weight: 510; color: var(--text-primary); margin: 0; }
.course-card-desc { font-size: 12px; color: var(--text-quaternary); margin: 2px 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.course-card-meta { font-size: 11px; color: var(--text-quaternary); font-family: var(--font-mono); }
.course-detail { padding: 0 16px 14px; border-top: 1px solid var(--border-subtle); padding-top: 12px; }
.detail-section-title { font-size: 12px; font-weight: 500; color: var(--text-tertiary); margin: 0 0 8px; }
.books-list { display: flex; flex-direction: column; gap: 6px; }
.book-row {
  display: flex; align-items: center; gap: 10px; padding: 8px 10px;
  border-radius: 6px; background: var(--bg-panel); border: 1px solid transparent;
  cursor: pointer; transition: all 0.12s;
}
.book-row:hover { border-color: var(--accent); background: var(--bg-surface); }
.book-row-icon { font-size: 14px; }
.book-row-title { flex: 1; font-size: 13px; color: var(--text-secondary); }
.book-row-format { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: var(--bg-surface); color: var(--text-quaternary); }
.empty-detail { padding: 20px; text-align: center; color: var(--text-quaternary); font-size: 12px; }

/* ── Books Tab ── */
.search-section {
  display: flex; gap: 12px; margin-bottom: 24px;
}
.search-input {
  flex: 1; padding: 10px 16px; border: 1px solid var(--border-subtle); border-radius: 8px;
  background: var(--bg-surface); color: var(--text-primary); font-size: 14px; outline: none;
}
.search-input:focus { border-color: var(--accent); }
.index-btn {
  padding: 10px 20px; border: 1px solid var(--border-subtle); border-radius: 8px;
  background: var(--bg-surface); color: var(--text-secondary); cursor: pointer; font-size: 13px;
}
.index-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.index-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.books-section { margin-bottom: 32px; }
.section-title { font-size: 15px; font-weight: 510; color: var(--text-primary); margin: 0 0 16px; }

.books-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.book-card {
  padding: 14px; background: var(--bg-surface); border: 1px solid var(--border-subtle);
  border-radius: 10px; cursor: pointer; transition: all 0.15s;
  display: flex; align-items: center; gap: 12px;
}
.book-card:hover { border-color: var(--accent); transform: translateY(-1px); }
.book-icon { font-size: 28px; }
.book-info { flex: 1; min-width: 0; }
.book-title { font-size: 13px; font-weight: 500; color: var(--text-primary); margin: 0 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.book-format { font-size: 11px; color: var(--text-quaternary); background: var(--bg-panel); padding: 2px 6px; border-radius: 4px; font-family: var(--font-mono); }

/* ── Reader Modal ── */
.reader-modal { position: fixed; inset: 0; z-index: 1000; }
.modal-backdrop { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.85); }
.modal-content { position: relative; width: 100%; height: 100%; }

@media (max-width: 768px) {
  .areas-grid, .books-grid { grid-template-columns: 1fr; }
  .search-section { flex-direction: column; }
  .index-btn { width: 100%; }
}
</style>
