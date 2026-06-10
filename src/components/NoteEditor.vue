<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  modelValue: string
  noteType?: 'general' | 'chapter' | 'reflection'
  placeholder?: string
  autosave?: boolean
  autosaveInterval?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'save', content: string): void
}>()

/* ── State ── */
const content = ref(props.modelValue || '')
const isEditing = ref(false)
const lastSaved = ref<Date | null>(null)
const showPreview = ref(false)
let autosaveTimer: number | null = null

/* ── Computed ── */
const charCount = computed(() => content.value.length)
const wordCount = computed(() => {
  const trimmed = content.value.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
})

const noteTypeLabel = computed(() => {
  switch (props.noteType) {
    case 'reflection': return '读后感'
    case 'chapter': return '章节笔记'
    default: return '笔记'
  }
})

/* ── Methods ── */
function startEditing() {
  isEditing.value = true
}

function saveContent() {
  emit('update:modelValue', content.value)
  emit('save', content.value)
  lastSaved.value = new Date()
}

function triggerAutosave() {
  if (props.autosave && content.value.trim()) {
    saveContent()
  }
}

function clearContent() {
  if (confirm('确定要清空内容吗？')) {
    content.value = ''
  }
}

/* ── Watch ── */
watch(() => props.modelValue, (newVal) => {
  if (newVal !== content.value) {
    content.value = newVal
  }
})

watch(content, () => {
  if (autosaveTimer) clearTimeout(autosaveTimer)
  if (props.autosave && props.autosaveInterval) {
    autosaveTimer = window.setTimeout(triggerAutosave, props.autosaveInterval)
  }
}, { deep: true })
</script>

<template>
  <div class="note-editor">
    <!-- Header -->
    <div class="editor-header">
      <div class="editor-title">
        <span class="note-type-badge">{{ noteTypeLabel }}</span>
        <span v-if="lastSaved" class="last-saved">
          已保存: {{ lastSaved.toLocaleTimeString() }}
        </span>
      </div>
      <div class="editor-actions">
        <button
          class="action-btn preview-btn"
          @click="showPreview = !showPreview"
          :class="{ active: showPreview }"
        >
          {{ showPreview ? '✏️ 编辑' : '👁️ 预览' }}
        </button>
        <button
          class="action-btn save-btn"
          @click="saveContent"
          :disabled="!content.trim()"
        >
          💾 保存
        </button>
      </div>
    </div>

    <!-- Toolbar (Edit Mode Only) -->
    <div v-if="isEditing && !showPreview" class="editor-toolbar">
      <button class="toolbar-btn" @click="insertMarkdown('**粗体**')" title="粗体">B</button>
      <button class="toolbar-btn" @click="insertMarkdown('*斜体*')" title="斜体">I</button>
      <button class="toolbar-btn" @click="insertMarkdown('# 标题')" title="标题">H</button>
      <button class="toolbar-btn" @click="insertMarkdown('- 列表项')" title="列表">•</button>
      <button class="toolbar-btn" @click="insertMarkdown('[链接文本](url)')" title="链接">🔗</button>
      <button class="toolbar-btn" @click="insertMarkdown('`代码`')" title="代码">{ }</button>
      <button class="toolbar-btn" @click="insertMarkdown('> 引用')" title="引用">❝</button>
      <div class="toolbar-spacer"></div>
      <button class="toolbar-btn clear-btn" @click="clearContent" title="清空">🗑️</button>
    </div>

    <!-- Editor / Preview -->
    <div class="editor-body">
      <!-- Edit Mode -->
      <textarea
        v-if="!showPreview"
        v-model="content"
        class="note-textarea"
        :placeholder="placeholder || '在此写下你的笔记...'"
        @focus="startEditing"
      ></textarea>

      <!-- Preview Mode -->
      <div v-else class="note-preview">
        <div v-if="!content" class="empty-preview">
          <span class="empty-icon">📝</span>
          <p>暂无笔记内容</p>
        </div>
        <div v-else class="preview-content">
          <div>{{ content }}</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="editor-footer">
      <div class="stats">
        <span class="stat">{{ wordCount }} 词</span>
        <span class="stat">{{ charCount }} 字符</span>
      </div>
      <div class="mode-indicator">
        {{ isEditing ? '✏️ 编辑中' : '点击开始编辑' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.note-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border-subtle);
}

.editor-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.note-type-badge {
  padding: 4px 10px;
  background: var(--accent);
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.last-saved {
  font-size: 11px;
  color: var(--text-quaternary);
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  background: var(--bg-surface);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.action-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.action-btn.save-btn {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.action-btn.save-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border-subtle);
}

.toolbar-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  background: var(--bg-surface);
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all 0.15s ease;
}

.toolbar-btn:hover {
  background: var(--hover-bg);
  border-color: var(--accent);
}

.toolbar-btn.clear-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
}

.toolbar-spacer {
  flex: 1;
}

.editor-body {
  flex: 1;
  min-height: 200px;
  position: relative;
}

.note-textarea {
  width: 100%;
  height: 100%;
  min-height: 250px;
  border: none;
  outline: none;
  padding: 16px;
  font-size: 14px;
  line-height: 1.8;
  resize: none;
  font-family: inherit;
  background: var(--bg-surface);
  color: var(--text-primary);
}

.note-textarea::placeholder {
  color: var(--text-quaternary);
}

.note-preview {
  padding: 16px;
  min-height: 250px;
}

.empty-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-quaternary);
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.preview-content {
  line-height: 1.8;
  color: var(--text-primary);
  white-space: pre-wrap;
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--bg-panel);
  border-top: 1px solid var(--border-subtle);
  font-size: 11px;
  color: var(--text-quaternary);
}

.stats {
  display: flex;
  gap: 16px;
}

.mode-indicator {
  font-style: italic;
}
</style>
