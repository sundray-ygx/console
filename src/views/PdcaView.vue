<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNotion } from '../composables/useNotion'

type PeriodLevel = 'week' | 'month' | 'quarter'

interface PeriodItem {
  title: string
  date?: string | null
}

interface PlanItem extends PeriodItem {
  id: string
  plan: string | null
  missing?: boolean
}

interface ReviewItem extends PeriodItem {
  id: string
  review: string | null
  generated?: boolean
  sourceCount?: number
  llm?: boolean
}

interface PdcaCurrent {
  period?: Record<PeriodLevel, PeriodItem | null>
  plan?: Record<PeriodLevel, PlanItem | null>
  review?: Record<PeriodLevel, ReviewItem | null>
}

const { fetchPdcaCurrent, loading, error } = useNotion()

const current = ref<PdcaCurrent | null>(null)

const levels: { key: PeriodLevel; label: string; planTitle: string; reviewTitle: string }[] = [
  { key: 'week', label: '本周', planTitle: '本周计划', reviewTitle: '本周复盘' },
  { key: 'month', label: '本月', planTitle: '本月计划', reviewTitle: '本月复盘' },
  { key: 'quarter', label: '本季度', planTitle: '本季度计划', reviewTitle: '本季度复盘' },
]

const periodText = computed(() => {
  if (!current.value?.period) return '当前周期'
  return levels
    .map(({ key, label }) => {
      const item = current.value?.period?.[key]
      return item?.title ? `${label}：${item.title}` : null
    })
    .filter(Boolean)
    .join(' / ') || '当前周期'
})

onMounted(async () => {
  current.value = await fetchPdcaCurrent()
})

function formatDate(date?: string | null) {
  return date || '当前周期'
}

function sourceText(item?: ReviewItem | null) {
  if (!item?.generated) return 'Notion 原始字段'
  return item.llm
    ? `LLM 总结 · ${item.sourceCount || 0} 条周复盘`
    : `规则汇总 · ${item.sourceCount || 0} 条周复盘`
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderMarkdown(text?: string | null) {
  if (!text) return ''

  const html: string[] = []
  let inList = false

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line) {
      if (inList) {
        html.push('</ul>')
        inList = false
      }
      continue
    }

    if (line.startsWith('### ')) {
      if (inList) { html.push('</ul>'); inList = false }
      html.push(`<h3>${escapeHtml(line.slice(4))}</h3>`)
      continue
    }
    if (line.startsWith('## ')) {
      if (inList) { html.push('</ul>'); inList = false }
      html.push(`<h2>${escapeHtml(line.slice(3))}</h2>`)
      continue
    }
    if (line.startsWith('# ')) {
      if (inList) { html.push('</ul>'); inList = false }
      html.push(`<h1>${escapeHtml(line.slice(2))}</h1>`)
      continue
    }
    if (/^[-*]\s+/.test(line)) {
      if (!inList) {
        html.push('<ul>')
        inList = true
      }
      html.push(`<li>${escapeHtml(line.replace(/^[-*]\s+/, ''))}</li>`)
      continue
    }

    if (inList) {
      html.push('</ul>')
      inList = false
    }
    html.push(`<p>${escapeHtml(line)}</p>`)
  }

  if (inList) html.push('</ul>')
  return html.join('')
}
</script>

<template>
  <div class="pdca">
    <h1 class="page-title">Reviews</h1>
    <p class="page-subtitle">{{ periodText }} · 计划、复盘与下阶段改进</p>

    <div v-if="loading && !current" class="loading-state">
      <span class="loading-spinner">⟳</span>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{{ error }}</p>
    </div>

    <div v-else class="pdca-layout">
      <section class="panel plan-panel">
        <div class="panel-header">
          <span class="panel-icon">📋</span>
          <div>
            <h2 class="panel-title">计划</h2>
            <p class="panel-desc">本周 / 本月 / 本季度的计划内容</p>
          </div>
        </div>

        <div class="period-grid">
          <article v-for="level in levels" :key="level.key" class="period-card">
            <div class="period-header">
              <div>
                <span class="period-label">{{ level.label }}</span>
                <h3 class="period-title">{{ level.planTitle }}</h3>
              </div>
              <span class="period-date">{{ formatDate(current?.plan?.[level.key]?.date) }}</span>
            </div>
            <div
              v-if="current?.plan?.[level.key]?.plan"
              class="period-content markdown-content"
              v-html="renderMarkdown(current.plan[level.key]?.plan)"
            ></div>
            <p v-else class="empty-content">暂无{{ level.planTitle }}</p>
          </article>
        </div>
      </section>

      <section class="panel review-panel">
        <div class="panel-header">
          <span class="panel-icon">🔎</span>
          <div>
            <h2 class="panel-title">复盘</h2>
            <p class="panel-desc">周复盘来自 Notion，月/季度复盘由 LLM 结合周计划与周复盘生成</p>
          </div>
        </div>

        <div class="period-grid">
          <article v-for="level in levels" :key="level.key" class="period-card">
            <div class="period-header">
              <div>
                <span class="period-label">{{ level.label }}</span>
                <h3 class="period-title">{{ level.reviewTitle }}</h3>
              </div>
              <div class="period-meta">
                <span class="source-badge" :class="{ generated: current?.review?.[level.key]?.generated, llm: current?.review?.[level.key]?.llm }">
                  {{ sourceText(current?.review?.[level.key]) }}
                </span>
                <span class="period-date">{{ formatDate(current?.review?.[level.key]?.date) }}</span>
              </div>
            </div>
            <div
              v-if="current?.review?.[level.key]?.review"
              class="period-content markdown-content"
              v-html="renderMarkdown(current.review[level.key]?.review)"
            ></div>
            <p v-else class="empty-content">暂无{{ level.reviewTitle }}</p>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.pdca { padding-top: 32px; }
.page-title { font-size: 28px; font-weight: 510; letter-spacing: -0.6px; color: var(--text-primary); margin-bottom: 4px; }
.page-subtitle { font-size: 14px; color: var(--text-tertiary); margin-bottom: 24px; }

.loading-state, .error-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 60px 20px; color: var(--text-tertiary);
}
.loading-spinner { font-size: 32px; animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.error-icon { font-size: 32px; }

.pdca-layout { display: flex; flex-direction: column; gap: 20px; }

.panel {
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--bg-surface);
  overflow: hidden;
}

.panel-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 18px;
  border-bottom: 1px solid var(--border-subtle);
}

.panel-icon { font-size: 24px; line-height: 1; }
.panel-title { font-size: 17px; font-weight: 510; color: var(--text-primary); margin-bottom: 4px; }
.panel-desc { font-size: 12px; color: var(--text-quaternary); }

.period-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding: 14px;
}

.period-card {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: var(--bg-panel);
}

.period-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 12px;
}

.period-label {
  display: inline-flex;
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 510;
  color: var(--accent);
}

.period-title { font-size: 15px; font-weight: 510; color: var(--text-primary); }

.period-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.period-date {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-quaternary);
  white-space: nowrap;
}

.source-badge {
  font-size: 10px;
  color: var(--text-quaternary);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  padding: 2px 8px;
  white-space: nowrap;
}

.source-badge.generated {
  color: var(--accent);
  border-color: rgba(113,112,255,0.28);
  background: rgba(113,112,255,0.08);
}
.source-badge.llm { color: #10b981; border-color: rgba(16,185,129,0.28); background: rgba(16,185,129,0.08); }

.period-content {
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-secondary);
  word-break: break-word;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  color: var(--text-primary);
  font-weight: 510;
  margin: 14px 0 8px;
}
.markdown-content :deep(h1) { font-size: 16px; }
.markdown-content :deep(h2) { font-size: 15px; }
.markdown-content :deep(h3) { font-size: 14px; color: var(--accent); }
.markdown-content :deep(h1:first-child),
.markdown-content :deep(h2:first-child),
.markdown-content :deep(h3:first-child) { margin-top: 0; }
.markdown-content :deep(p) { margin: 0 0 8px; }
.markdown-content :deep(ul) { margin: 0 0 12px; padding-left: 18px; }
.markdown-content :deep(li) { margin-bottom: 5px; }

.empty-content { font-size: 13px; color: var(--text-quaternary); }

@media (max-width: 1200px) {
  .period-grid { grid-template-columns: 1fr; }
}

@media (max-width: 560px) {
  .period-header { flex-direction: column; }
  .period-meta { align-items: flex-start; }
}
</style>
