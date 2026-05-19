<script setup lang="ts">
defineProps<{
  html?: string
}>()
</script>

<template>
  <div class="markdown-viewer">
    <div v-if="html" class="markdown-content" v-html="html"></div>
    <div v-else class="markdown-empty">
      <span class="empty-icon">📄</span>
      <p>暂无内容</p>
    </div>
  </div>
</template>

<style scoped>
.markdown-viewer {
  height: 100%;
  overflow-y: auto;
}

.markdown-content {
  padding: 20px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.markdown-content :deep(h1) {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--text-primary);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.markdown-content :deep(h2) {
  font-size: 20px;
  font-weight: 600;
  margin: 24px 0 12px 0;
  color: var(--text-primary);
}

.markdown-content :deep(h3) {
  font-size: 16px;
  font-weight: 600;
  margin: 20px 0 10px 0;
  color: var(--text-secondary);
}

.markdown-content :deep(p) {
  margin: 0 0 12px 0;
  font-size: 14px;
}

.markdown-content :deep(a) {
  color: var(--accent);
  text-decoration: none;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 0 0 12px 0;
  padding-left: 20px;
}

.markdown-content :deep(li) {
  margin: 4px 0;
  font-size: 14px;
}

.markdown-content :deep(code) {
  font-family: var(--font-mono);
  font-size: 13px;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
}

.markdown-content :deep(pre) {
  font-family: var(--font-mono);
  font-size: 13px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 12px;
  margin: 12px 0;
  overflow-x: auto;
}

.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 13px;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid var(--border-subtle);
  padding: 8px 12px;
  text-align: left;
}

.markdown-content :deep(th) {
  background: rgba(255, 255, 255, 0.03);
  font-weight: 600;
  color: var(--text-primary);
}

.markdown-content :deep(blockquote) {
  margin: 12px 0;
  padding: 8px 16px;
  border-left: 3px solid var(--accent);
  background: rgba(113, 112, 255, 0.05);
  color: var(--text-tertiary);
  font-style: italic;
}

.markdown-content :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 12px 0;
}

.markdown-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-subtle);
  margin: 24px 0;
}

.markdown-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-quaternary);
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.markdown-empty p {
  margin: 0;
  font-size: 14px;
}
</style>
