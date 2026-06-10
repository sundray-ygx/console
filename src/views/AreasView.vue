<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAreas } from '../composables/useAreas'
import { useBooks, type Book } from '../composables/useBooks'
import CourseReader from '../components/CourseReader.vue'

const router = useRouter()
const { areas, loading, error, fetchAreas } = useAreas()
const { indexBooks, searchBooks, getRecentBooks } = useBooks()

/* ── State ── */
const activeTab = ref<'overview' | 'courses'>('overview')
const searchQuery = ref('')
const recentBooks = ref<Book[]>([])
const searchResults = ref<Book[]>([])
const selectedBook = ref<Book | null>(null)
const loadingBooks = ref(false)

/* ── Methods ── */
function handleChildClick(child: { id: string; type: string }) {
  if (child.type === 'course') {
    router.push(`/learn?course=${encodeURIComponent(child.id)}`)
  }
}

async function triggerIndex() {
  loadingBooks.value = true
  try {
    await indexBooks()
    await loadRecentBooks()
  } finally {
    loadingBooks.value = false
  }
}

async function loadRecentBooks() {
  loadingBooks.value = true
  try {
    recentBooks.value = await getRecentBooks(12)
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
    searchResults.value = await searchBooks(searchQuery.value, 10)
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

onMounted(async () => {
  fetchAreas()
  await loadRecentBooks()
})
</script>

<template>
  <div class="areas">
    <!-- Course Reader Modal -->
    <div v-if="selectedBook" class="reader-modal">
      <div class="modal-backdrop" @click="closeReader"></div>
      <div class="modal-content">
        <CourseReader
          :book="selectedBook"
          @close="closeReader"
        />
      </div>
    </div>

    <h1 class="page-title" style="margin-bottom:4px">Areas</h1>
    <p class="page-subtitle" style="font-size:14px;color:var(--text-tertiary);margin-bottom:24px">
      Life responsibilities grouped by domain — each area contains related resources and courses
    </p>

    <!-- Tab Navigation -->
    <div class="tabs">
      <button
        class="tab"
        :class="{ active: activeTab === 'overview' }"
        @click="activeTab = 'overview'"
      >
        概览
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'courses' }"
        @click="activeTab = 'courses'"
      >
        📚 课程
      </button>
    </div>

    <!-- Overview Tab -->
    <div v-if="activeTab === 'overview'">
      <div v-if="loading && areas.length === 0" class="loading-state">
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
        <div v-for="area in areas" :key="area.id" class="area-card">
          <div class="area-header">
            <span class="area-icon">{{ area.icon }}</span>
            <div class="area-meta">
              <h2 class="area-name">{{ area.name }}</h2>
              <span class="area-source">{{ area.source }}</span>
            </div>
            <span class="area-count">{{ area.itemCount }}</span>
          </div>
          <div v-if="area.children.length > 0" class="area-children">
            <div
              v-for="child in area.children"
              :key="child.id"
              class="child-item"
              @click="handleChildClick(child)"
            >
              <span class="child-type">{{ child.type }}</span>
              <span class="child-name">{{ child.name }}</span>
              <span class="child-count">{{ child.count }}</span>
            </div>
          </div>
          <div v-else class="area-empty">
            <span>No linked resources</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Courses Tab -->
    <div v-else-if="activeTab === 'courses'" class="courses-tab">
      <!-- Search Bar -->
      <div class="search-section">
        <input
          type="text"
          class="search-input"
          v-model="searchQuery"
          placeholder="搜索书籍..."
          @input="handleSearch"
        />
        <button class="index-btn" @click="triggerIndex" :disabled="loadingBooks">
          🔄 扫描书籍
        </button>
      </div>

      <!-- Recent Books -->
      <div class="course-section">
        <h3 class="section-title">📖 最近添加</h3>
        <div v-if="loadingBooks" class="loading-state mini">
          <span class="loading-spinner">⟳</span>
        </div>
        <div v-else-if="recentBooks.length === 0" class="empty-state mini">
          <span class="empty-icon">📚</span>
          <p>暂无书籍，点击"扫描书籍"开始索引</p>
        </div>
        <div v-else class="books-grid">
          <div
            v-for="book in recentBooks"
            :key="book.id"
            class="book-card"
            @click="openBook(book)"
          >
            <span class="book-icon">📕</span>
            <div class="book-info">
              <h4 class="book-title">{{ book.title }}</h4>
              <span class="book-format">{{ book.file_type.toUpperCase() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Search Results -->
      <div v-if="searchResults.length > 0" class="course-section">
        <h3 class="section-title">🔍 搜索结果</h3>
        <div class="books-grid">
          <div
            v-for="book in searchResults"
            :key="book.id"
            class="book-card"
            @click="openBook(book)"
          >
            <span class="book-icon">📕</span>
            <div class="book-info">
              <h4 class="book-title">{{ book.title }}</h4>
              <span class="book-format">{{ book.file_type.toUpperCase() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.areas { padding-top: 32px; }

/* Tabs */
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

.tab:hover {
  color: var(--text-primary);
}

.tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.loading-state, .error-state, .empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 60px 20px; color: var(--text-tertiary);
}

.loading-state.mini {
  padding: 30px 20px;
}

.empty-state.mini {
  padding: 30px 20px;
}

.empty-state.mini .empty-icon {
  font-size: 24px;
}

.loading-spinner { font-size: 32px; animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.error-icon, .empty-icon { font-size: 32px; }

.areas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
.area-card { border: 1px solid var(--border-subtle); border-radius: 12px; background: var(--bg-surface); overflow: hidden; }
.area-header { display: flex; align-items: center; gap: 12px; padding: 16px; border-bottom: 1px solid var(--border-subtle); }
.area-icon { font-size: 24px; }
.area-meta { flex: 1; min-width: 0; }
.area-name { font-size: 16px; font-weight: 510; color: var(--text-primary); margin: 0; }
.area-source { font-size: 11px; color: var(--text-quaternary); font-family: var(--font-mono); }
.area-count { font-size: 14px; font-family: var(--font-mono); color: var(--text-quaternary); background: var(--bg-canvas); padding: 2px 8px; border-radius: 6px; }
.area-children { padding: 10px; display: flex; flex-direction: column; gap: 6px; }
.child-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 8px;
  background: var(--bg-panel); border: 1px solid var(--border-subtle);
  cursor: pointer; transition: all 0.12s;
}
.child-item:hover { border-color: var(--border-standard); background: var(--bg-canvas); }
.child-type { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); flex-shrink: 0; }
.child-name { flex: 1; font-size: 13px; color: var(--text-secondary); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.child-count { font-size: 11px; font-family: var(--font-mono); color: var(--text-quaternary); }
.area-empty { padding: 20px; text-align: center; font-size: 12px; color: var(--text-quaternary); }

/* Courses Tab */
.courses-tab {
  padding-top: 8px;
}

.search-section {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.search-input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  border-color: var(--accent);
}

.index-btn {
  padding: 10px 20px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-surface);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.index-btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.index-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.course-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 15px;
  font-weight: 510;
  color: var(--text-primary);
  margin: 0 0 16px;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}

.book-card {
  padding: 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
}

.book-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.book-icon {
  font-size: 32px;
}

.book-info {
  flex: 1;
  min-width: 0;
}

.book-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-format {
  font-size: 11px;
  color: var(--text-quaternary);
  background: var(--bg-panel);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono);
}

/* Reader Modal */
.reader-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
}

.modal-content {
  position: relative;
  width: 100%;
  height: 100%;
}

@media (max-width: 768px) {
  .areas-grid, .books-grid { grid-template-columns: 1fr; }
  .search-section { flex-direction: column; }
  .index-btn { width: 100%; }
}
</style>
