<script setup lang="ts">
import { ref } from 'vue'
import { API_BASE } from '../config/services'

interface DirOption { path: string; name: string }

const props = defineProps<{
  dirs: DirOption[]
  defaultDir: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'uploaded'): void
}>()

const selectedDir = ref(props.defaultDir || 'inbox')
const files = ref<File[]>([])
const uploading = ref(false)
const dragOver = ref(false)

function onDrop(e: DragEvent) {
  e.preventDefault()
  dragOver.value = false
  if (e.dataTransfer?.files) {
    files.value = [...files.value, ...Array.from(e.dataTransfer.files)]
  }
}

function onFileInput(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) {
    files.value = [...files.value, ...Array.from(input.files)]
  }
}

function removeFile(index: number) {
  files.value.splice(index, 1)
}

async function upload() {
  if (files.value.length === 0) return
  uploading.value = true
  for (const file of files.value) {
    const form = new FormData()
    form.append('file', file)
    form.append('targetDir', selectedDir.value)
    await fetch(`${API_BASE}/api/fs/upload`, { method: 'POST', body: form })
  }
  uploading.value = false
  emit('uploaded')
  emit('close')
}
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('close')">
    <div class="dialog">
      <div class="dialog-header">
        <span class="dialog-title">上传文件</span>
        <button class="dialog-close" @click="emit('close')">✕</button>
      </div>
      <div class="dialog-body">
        <label class="field-label">目标目录</label>
        <select v-model="selectedDir" class="dir-select">
          <option v-for="d in dirs" :key="d.path" :value="d.path">{{ d.name }}</option>
        </select>

        <div
          class="drop-zone"
          :class="{ active: dragOver }"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop="onDrop"
        >
          <p v-if="files.length === 0">拖拽文件到此处</p>
          <div v-else class="file-list">
            <div v-for="(f, i) in files" :key="i" class="file-item">
              <span class="file-name">{{ f.name }}</span>
              <span class="file-size">{{ (f.size / 1024).toFixed(1) }} KB</span>
              <button class="file-remove" @click="removeFile(i)">✕</button>
            </div>
          </div>
        </div>
        <input type="file" multiple @change="onFileInput" class="file-input" id="file-input" />
        <label for="file-input" class="file-btn">选择文件</label>
      </div>
      <div class="dialog-footer">
        <button class="btn-cancel" @click="emit('close')">取消</button>
        <button class="btn-upload" :disabled="files.length === 0 || uploading" @click="upload">
          {{ uploading ? '上传中...' : '上传' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
}
.dialog {
  background: var(--bg-panel); border: 1px solid var(--border-standard);
  border-radius: 12px; width: 480px; max-width: 90vw;
}
.dialog-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid var(--border-subtle);
}
.dialog-title { font-size: 14px; font-weight: 510; color: var(--text-primary); }
.dialog-close { background: none; border: none; color: var(--text-quaternary); cursor: pointer; font-size: 16px; }
.dialog-body { padding: 18px; }
.field-label { display: block; font-size: 11px; color: var(--text-quaternary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
.dir-select {
  width: 100%; padding: 8px 10px; border-radius: 6px;
  border: 1px solid var(--border-subtle); background: var(--bg-canvas);
  color: var(--text-primary); font-size: 13px; margin-bottom: 14px;
  font-family: var(--font-mono);
}
.drop-zone {
  border: 2px dashed var(--border-subtle); border-radius: 8px;
  padding: 24px; text-align: center; color: var(--text-quaternary);
  font-size: 13px; transition: border-color 0.15s; min-height: 80px;
}
.drop-zone.active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 5%, transparent); }
.file-list { display: flex; flex-direction: column; gap: 6px; text-align: left; }
.file-item {
  display: flex; align-items: center; gap: 8px; padding: 6px 8px;
  background: var(--bg-surface); border-radius: 4px;
}
.file-name { flex: 1; font-size: 12px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-size { font-size: 10px; font-family: var(--font-mono); color: var(--text-quaternary); }
.file-remove { background: none; border: none; color: var(--text-quaternary); cursor: pointer; font-size: 12px; }
.file-input { display: none; }
.file-btn {
  display: inline-block; margin-top: 10px; padding: 6px 14px;
  border: 1px solid var(--border-subtle); border-radius: 6px;
  color: var(--text-secondary); font-size: 12px; cursor: pointer;
  transition: all 0.15s;
}
.file-btn:hover { background: var(--hover-bg); }
.dialog-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 12px 18px; border-top: 1px solid var(--border-subtle);
}
.btn-cancel {
  padding: 6px 16px; border-radius: 6px; border: 1px solid var(--border-subtle);
  background: none; color: var(--text-secondary); cursor: pointer; font-size: 13px;
}
.btn-upload {
  padding: 6px 16px; border-radius: 6px; border: none;
  background: var(--accent); color: #fff; cursor: pointer; font-size: 13px; font-weight: 510;
}
.btn-upload:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
