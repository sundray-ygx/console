<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import PdfViewer from './PdfViewer.vue'
import MarkdownViewer from './MarkdownViewer.vue'
import NoteEditor from './NoteEditor.vue'
import { useBooks, type Book } from '../composables/useBooks'
import { useLearning, type Note, type Highlight } from '../composables/useLearning'

const props = defineProps<{
  book?: Book | null
  markdownContent?: string
  areaId?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

/* ── State ── */
const activeTab = ref<'notes' | 'highlights'>('notes')
const sidebarOpen = ref(true)
const notes = ref<Note[]>([])
const highlights = ref<Highlight[]>([])
const currentProgress = ref(0)

const { getBookViewUrl } = useBooks()
const {
  fetchNotes,
  createNote,
  updateNote,
  fetchHighlights,
  addHighlight,
  fetchProgress,
  saveProgress,
} = useLearning()

/* ── Computed ── */
const viewerSource = computed(() => {
  if (props.markdownContent) return props.markdownContent
  if (props.book) return getBookViewUrl(props.book.id)
  return ''
})

const isPdf = computed(() => props.book?.file_type === 'pdf')
const isMarkdown = computed(() => !!props.markdownContent)

const chapterNotes = computed(() =>
  notes.value.filter(n => n.note_type === 'chapter')
)

const reflectionNotes = computed(() =>
  notes.value.filter(n => n.note_type === 'reflection')
)

/* ── Methods ── */
async function loadData() {
  if (!props.book) return

  const areaId = props.areaId || 'default'
  const [fetchedNotes, fetchedHighlights, progress] = await Promise.all([
    fetchNotes(props.book.id.toString()),
    fetchHighlights(props.book.id.toString()),
    fetchProgress(props.book.id.toString()),
  ])

  notes.value = fetchedNotes
  highlights.value = fetchedHighlights
  currentProgress.value = progress?.progress || 0
}

function handlePageChange(page: number) {
  if (props.book) {
    saveProgress({
      area_id: props.areaId || 'default',
      course_id: props.book.id.toString(),
      progress: page,
    })
  }
}

function handleProgressChange(progress: number) {
  currentProgress.value = progress
}

async function handleHighlightSelection(selection: { text: string; position: string }) {
  if (!props.book) return

  const id = await addHighlight({
    area_id: props.areaId || 'default',
    course_id: props.book.id.toString(),
    content: selection.text,
    position: selection.position,
    color: '#ffeb3b',
  })

  if (id) {
    highlights.value = await fetchHighlights(props.book.id.toString())
  }
}

async function handleNoteSave(content: string) {
  if (!props.book || !content.trim()) return

  const existingNote = chapterNotes.value[0]
  if (existingNote?.id) {
    await updateNote(existingNote.id, content)
  } else {
    await createNote({
      area_id: props.areaId || 'default',
      course_id: props.book.id.toString(),
      note_type: 'chapter',
      content,
    })
  }

  notes.value = await fetchNotes(props.book.id.toString())
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

/* ── Lifecycle ── */
onMounted(() => {
  loadData()
})

watch(() => props.book, () => {
  loadData()
})
</script>

<template>
  <div class="course-reader">
    <!-- Header -->
    <div class="reader-header">
      <div class="header-left">
        <button class="close-btn" @click="emit('close')" title="关闭">✕</button>
        <h2 class="book-title">{{ book?.title || '课程阅读' }}</h2>
      </div>
      <div class="header-right">
        <div class="progress-badge">
          <span class="progress-icon">📖</span>
          <span class="progress-text">{{ currentProgress }}% 已读</span>
        </div>
        <button
          class="sidebar-toggle"
          @click="toggleSidebar"
          :class="{ open: sidebarOpen }"
          :title="sidebarOpen ? '隐藏侧边栏' : '显示侧边栏'"
        >
          {{ sidebarOpen ? '◀' : '▶' }}
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="reader-body">
      <!-- Viewer Area -->
      <div class="viewer-section" :class="{ 'sidebar-open': sidebarOpen }">
        <!-- PDF Viewer -->
        <PdfViewer
          v-if="isPdf"
          :src="viewerSource"
          @page-change="handlePageChange"
          @progress-change="handleProgressChange"
          @highlight="handleHighlightSelection"
        />

        <!-- Markdown Viewer -->
        <MarkdownViewer
          v-else-if="isMarkdown"
          :html="viewerSource"
        />

        <!-- Empty State -->
        <div v-else class="empty-viewer">
          <span class="empty-icon">📚</span>
          <p>选择一本书籍开始阅读</p>
        </div>
      </div>

      <!-- Sidebar (Notes / Highlights) -->
      <div v-if="sidebarOpen" class="sidebar-section">
        <!-- Tabs -->
        <div class="sidebar-tabs">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'notes' }"
            @click="activeTab = 'notes'"
          >
            📝 笔记 ({{ notes.length }})
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'highlights' }"
            @click="activeTab = 'highlights'"
          >
            🎨 高亮 ({{ highlights.length }})
          </button>
        </div>

        <!-- Notes Tab Content -->
        <div v-if="activeTab === 'notes'" class="tab-content">
          <div class="notes-section">
            <h4 class="section-title">章节笔记</h4>
            <NoteEditor
              :model-value="chapterNotes[0]?.content || ''"
              note-type="chapter"
              :autosave="true"
              :autosave-interval="3000"
              @save="handleNoteSave"
            />
          </div>

          <div class="notes-section" style="margin-top: 20px;">
            <h4 class="section-title">读后感</h4>
            <NoteEditor
              :model-value="reflectionNotes[0]?.content || ''"
              note-type="reflection"
              :autosave="true"
              :autosave-interval="5000"
              placeholder="写下你的阅读感悟..."
              @save="handleNoteSave"
            />
          </div>
        </div>

        <!-- Highlights Tab Content -->
        <div v-else-if="activeTab === 'highlights'" class="tab-content">
          <div v-if="!highlights.length" class="empty-highlights">
            <span class="empty-icon">🎨</span>
            <p>选中文本添加高亮标记</p>
          </div>
          <div v-else class="highlights-list">
            <div
              v-for="hl in highlights"
              :key="hl.id"
              class="highlight-item"
              :style="{ borderLeftColor: hl.color }"
            >
              <p class="highlight-text">{{ hl.content }}</p>
              <span class="highlight-position">{{ hl.position }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.course-reader {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-canvas);
}

.reader-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: var(--bg-panel);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.close-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.book-title {
  font-size: 16px;
  font-weight: 510;
  color: var(--text-primary);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-panel);
  border-radius: 16px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.sidebar-toggle {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: var(--bg-panel);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s ease;
}

.sidebar-toggle:hover {
  background: var(--hover-bg);
}

.sidebar-toggle.open {
  background: var(--accent);
  color: white;
}

.reader-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.viewer-section {
  flex: 1;
  overflow: hidden;
  transition: all 0.3s ease;
}

.viewer-section.sidebar-open {
  flex: 0 0 calc(100% - 380px);
}

.empty-viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-quaternary);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.sidebar-section {
  flex: 0 0 380px;
  background: var(--bg-surface);
  border-left: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-subtle);
}

.tab-btn {
  flex: 1;
  padding: 12px;
  border: none;
  background: none;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--accent);
  border-bottom: 2px solid var(--accent);
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.notes-section .section-title {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.empty-highlights {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-quaternary);
  text-align: center;
}

.highlights-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.highlight-item {
  padding: 12px;
  background: var(--bg-panel);
  border-radius: 6px;
  border-left: 3px solid #ffeb3b;
}

.highlight-text {
  margin: 0 0 8px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-primary);
}

.highlight-position {
  font-size: 11px;
  color: var(--text-quaternary);
}
</style>
