<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'

// Set worker source from CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

const props = defineProps<{
  src: string
  initialPage?: number
}>()

const emit = defineEmits<{
  (e: 'page-change', page: number): void
  (e: 'progress-change', progress: number): void
  (e: 'highlight', selection: { text: string; position: string }): void
}>()

/* ── State ── */
const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const currentPage = ref(props.initialPage || 1)
const totalPages = ref(0)
const pdfDoc = ref<pdfjsLib.PDFDocumentProxy | null>(null)
const scale = ref(1.5)
const zoomLevels = [0.75, 1, 1.25, 1.5, 2, 2.5, 3]

/* ── Computed ── */
const progressPercent = computed(() => {
  if (totalPages.value === 0) return 0
  return Math.round((currentPage.value / totalPages.value) * 100)
})

const canZoomIn = computed(() => scale.value < zoomLevels[zoomLevels.length - 1])
const canZoomOut = computed(() => scale.value > zoomLevels[0])

/* ── Methods ── */
async function loadPdf() {
  loading.value = true
  error.value = null
  try {
    const loadingTask = pdfjsLib.getDocument(props.src)
    pdfDoc.value = await loadingTask.promise
    totalPages.value = pdfDoc.value.numPages
    await renderPage(currentPage.value)
  } catch (e: any) {
    error.value = e.message
    console.error('PDF loading error:', e)
  } finally {
    loading.value = false
  }
}

async function renderPage(pageNum: number) {
  if (!pdfDoc.value || !canvasRef.value) return

  try {
    const page = await pdfDoc.value.getPage(pageNum)
    const viewport = page.getViewport({ scale: scale.value })

    const canvas = canvasRef.value
    const context = canvas.getContext('2d')
    if (!context) return

    canvas.height = viewport.height
    canvas.width = viewport.width

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    }

    await page.render(renderContext).promise
    currentPage.value = pageNum
    emit('page-change', pageNum)
    emit('progress-change', progressPercent.value)
  } catch (e: any) {
    console.error('PDF rendering error:', e)
    error.value = e.message
  }
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    renderPage(page)
  }
}

function nextPage() {
  goToPage(currentPage.value + 1)
}

function prevPage() {
  goToPage(currentPage.value - 1)
}

function zoomIn() {
  const idx = zoomLevels.indexOf(scale.value)
  if (idx < zoomLevels.length - 1) {
    scale.value = zoomLevels[idx + 1]
    renderPage(currentPage.value)
  }
}

function zoomOut() {
  const idx = zoomLevels.indexOf(scale.value)
  if (idx > 0) {
    scale.value = zoomLevels[idx - 1]
    renderPage(currentPage.value)
  }
}

function handleTextSelection() {
  const selection = window.getSelection()
  if (selection && selection.toString().trim()) {
    emit('highlight', {
      text: selection.toString(),
      position: `page-${currentPage.value}`,
    })
  }
}

/* ── Lifecycle ── */
onMounted(() => {
  loadPdf()
  document.addEventListener('mouseup', handleTextSelection)
})

onUnmounted(() => {
  document.removeEventListener('mouseup', handleTextSelection)
  if (pdfDoc.value) {
    pdfDoc.value.destroy()
  }
})

watch(() => props.src, () => {
  loadPdf()
})
</script>

<template>
  <div class="pdf-viewer">
    <!-- Toolbar -->
    <div class="pdf-toolbar">
      <div class="toolbar-left">
        <button @click="prevPage" :disabled="currentPage <= 1" class="toolbar-btn" title="上一页">
          ◀
        </button>
        <span class="page-indicator">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <button @click="nextPage" :disabled="currentPage >= totalPages" class="toolbar-btn" title="下一页">
          ▶
        </button>
      </div>
      <div class="toolbar-right">
        <button @click="zoomOut" :disabled="!canZoomOut" class="toolbar-btn" title="缩小">
          −
        </button>
        <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
        <button @click="zoomIn" :disabled="!canZoomIn" class="toolbar-btn" title="放大">
          +
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="pdf-loading">
      <div class="spinner"></div>
      <p>加载 PDF 中...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="pdf-error">
      <span class="error-icon">⚠️</span>
      <p>{{ error }}</p>
    </div>

    <!-- PDF Canvas -->
    <div v-else class="pdf-canvas-container" ref="containerRef">
      <canvas ref="canvasRef" class="pdf-canvas"></canvas>
    </div>

    <!-- Progress Bar -->
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
    </div>
  </div>
</template>

<style scoped>
.pdf-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-canvas);
}

.pdf-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: var(--bg-panel);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.15s ease;
}

.toolbar-btn:hover:not(:disabled) {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-indicator,
.zoom-level {
  color: var(--text-tertiary);
  font-size: 12px;
  font-family: var(--font-mono);
  min-width: 60px;
  text-align: center;
}

.pdf-canvas-container {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  padding: 20px;
  background: var(--bg-canvas);
}

.pdf-canvas {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  background: white;
}

.pdf-loading,
.pdf-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  gap: 12px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-subtle);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 40px;
}

.pdf-error p {
  margin: 0;
  font-size: 14px;
}

.progress-bar {
  height: 3px;
  background: var(--border-subtle);
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.2s ease;
}
</style>
