<script setup lang="ts">
import { ref, computed } from 'vue'

interface TreeItem {
  name: string
  type: 'dir' | 'file'
  path: string
  count?: number
  children?: TreeItem[]
}

const props = defineProps<{
  items: TreeItem[]
  selectedPath?: string
}>()

const emit = defineEmits<{
  (e: 'select', path: string): void
  (e: 'download', path: string): void
  (e: 'rename', path: string, newName: string): void
  (e: 'delete', path: string): void
}>()

const expandedDirs = ref<Set<string>>(new Set())
const activeMenu = ref<string | null>(null)
const renamingPath = ref<string | null>(null)
const renameInput = ref('')

function showMenu(path: string) { activeMenu.value = path }
function hideMenu() { activeMenu.value = null }

function startRename(item: TreeItem) {
  renamingPath.value = item.path
  renameInput.value = item.name
  activeMenu.value = null
}

function confirmRename(item: TreeItem) {
  if (renameInput.value && renameInput.value !== item.name) {
    const dir = item.path.includes('/') ? item.path.substring(0, item.path.lastIndexOf('/')) : ''
    const newPath = dir ? `${dir}/${renameInput.value}` : renameInput.value
    emit('rename', item.path, newPath)
  }
  renamingPath.value = null
}

function handleDelete(item: TreeItem) {
  activeMenu.value = null
  if (confirm(`确定删除 "${item.name}" 吗？`)) {
    emit('delete', item.path)
  }
}

function handleDownload(item: TreeItem) {
  activeMenu.value = null
  emit('download', item.path)
}

function toggleDir(path: string) {
  if (expandedDirs.value.has(path)) {
    expandedDirs.value.delete(path)
  } else {
    expandedDirs.value.add(path)
  }
}

function isExpanded(path: string): boolean {
  return expandedDirs.value.has(path)
}

function renderTree(items: TreeItem[], depth: number = 0): Array<{ item: TreeItem; depth: number }> {
  const result: Array<{ item: TreeItem; depth: number }> = []
  for (const item of items) {
    result.push({ item, depth })
    if (item.type === 'dir' && isExpanded(item.path) && item.children) {
      result.push(...renderTree(item.children, depth + 1))
    }
  }
  return result
}

const flatTree = computed(() => renderTree(props.items))

function handleClick(item: TreeItem) {
  if (item.type === 'dir') {
    toggleDir(item.path)
  } else {
    emit('select', item.path)
  }
}
</script>

<template>
  <div class="file-tree" @click="hideMenu">
    <div
      v-for="{ item, depth } in flatTree"
      :key="item.path"
      class="tree-item"
      :class="{
        'is-dir': item.type === 'dir',
        'is-file': item.type === 'file',
        'is-selected': selectedPath === item.path
      }"
      :style="{ paddingLeft: `${12 + depth * 16}px` }"
      @click="handleClick(item)"
    >
      <svg
        v-if="item.type === 'dir'"
        class="dir-arrow"
        :class="{ 'is-expanded': isExpanded(item.path) }"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M9 18l6-6-6-6"/>
      </svg>
      <span v-else class="file-dot"></span>

      <span class="item-icon">
        {{ item.type === 'dir' ? (isExpanded(item.path) ? '📂' : '📁') : '📄' }}
      </span>

      <input
        v-if="renamingPath === item.path"
        v-model="renameInput"
        class="rename-input"
        @keyup.enter="confirmRename(item)"
        @keyup.escape="renamingPath = null"
        @blur="confirmRename(item)"
        @click.stop
      />
      <span v-else class="item-name">{{ item.name }}</span>
      <template v-if="item.type === 'file'">
        <button
          v-if="activeMenu !== item.path && renamingPath !== item.path"
          class="action-btn"
          @click.stop="showMenu(item.path)"
          title="操作"
        >···</button>
        <div v-if="activeMenu === item.path" class="action-menu" @click.stop>
          <button class="menu-item" @click="handleDownload(item)">下载</button>
          <button class="menu-item" @click="startRename(item)">重命名</button>
          <button class="menu-item danger" @click="handleDelete(item)">删除</button>
        </div>
      </template>
      <span v-if="item.count !== undefined" class="item-count">{{ item.count }}</span>
    </div>
  </div>
</template>

<style scoped>
.file-tree {
  display: flex;
  flex-direction: column;
}

.tree-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-tertiary);
  transition: all 0.12s;
  user-select: none;
}

.tree-item:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
}

.tree-item.is-selected {
  background: rgba(113, 112, 255, 0.08);
  color: var(--accent);
}

.dir-arrow {
  color: var(--text-quaternary);
  transition: transform 0.15s;
  flex-shrink: 0;
}

.dir-arrow.is-expanded {
  transform: rotate(90deg);
}

.file-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-quaternary);
  flex-shrink: 0;
}

.item-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.item-name {
  font-family: var(--font-mono);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-count {
  font-size: 10px;
  color: var(--text-quaternary);
  font-family: var(--font-mono);
}

.action-btn {
  background: none; border: none; color: var(--text-quaternary);
  cursor: pointer; padding: 0 4px; font-size: 14px; letter-spacing: 1px;
  opacity: 0; transition: opacity 0.15s; flex-shrink: 0;
}
.tree-item:hover .action-btn { opacity: 1; }
.action-menu {
  position: absolute; right: 8px; top: 100%; z-index: 10;
  background: var(--bg-panel); border: 1px solid var(--border-standard);
  border-radius: 6px; padding: 4px 0; min-width: 80px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.menu-item {
  display: block; width: 100%; text-align: left; padding: 5px 12px;
  background: none; border: none; color: var(--text-secondary);
  font-size: 11px; cursor: pointer; font-family: var(--font-sans);
}
.menu-item:hover { background: var(--hover-bg); }
.menu-item.danger { color: #ef4444; }
.menu-item.danger:hover { background: color-mix(in srgb, #ef4444 10%, transparent); }
.rename-input {
  flex: 1; background: var(--bg-canvas); border: 1px solid var(--accent);
  border-radius: 3px; padding: 1px 4px; font-size: 12px; color: var(--text-primary);
  font-family: var(--font-mono); outline: none; min-width: 0;
}
</style>
