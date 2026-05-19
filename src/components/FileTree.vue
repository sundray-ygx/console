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
}>()

const expandedDirs = ref<Set<string>>(new Set())

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
  <div class="file-tree">
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

      <span class="item-name">{{ item.name }}</span>
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
</style>
