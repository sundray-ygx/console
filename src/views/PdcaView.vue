<script setup lang="ts">
import { ref, computed } from 'vue'

interface Period {
  id: string; label: string; type: 'year' | 'quarter' | 'month' | 'week' | 'day';
  summary: string; plan: string; do_: string; check: string; act: string;
  children?: Period[]
}

const selected = ref('w20')

const periods: Period[] = [
  {
    id: 'y2026', label: '2026 年', type: 'year',
    summary: '年度关键词：系统化 · 专业化 · 自动化',
    plan: '建立完整的个人知识管理系统，完成技术栈升级，实现核心服务的自动化运维',
    do_: '持续推进中，已完成基础设施搭建和知识库框架',
    check: 'Q1 达成率 72%，技术成长超预期，生活管理需加强',
    act: 'Q2 加强生活 OKR 的执行力度，增加每周复盘频率',
    children: [
      {
        id: 'q2', label: 'Q2 (4-6月)', type: 'quarter',
        summary: '季度主题：深耕与产出',
        plan: '完成 3 个技术项目上线，知识库文章输出 6 篇，体重达标 70kg',
        do_: '进行中 — 已完成 2 个项目，3 篇文章，体重 72kg',
        check: '技术项目进度正常，文章输出略落后，体重管理需要加把劲',
        act: '增加写作时间投入，严格执行运动计划',
        children: [
          {
            id: 'm5', label: '5 月', type: 'month',
            summary: '月度重点：Dashboard 上线 + 知识库整理',
            plan: '完成 Console Dashboard V2 上线，整理 Notion 知识库 200+ 条笔记',
            do_: 'Dashboard 开发中（80%），知识库已整理 120 条',
            check: 'Dashboard 进度符合预期，知识库整理速度需加快',
            act: '周末集中时间处理知识库归档',
            children: [
              {
                id: 'w20', label: '第 20 周 (5/12-5/18)', type: 'week',
                summary: '本周：Dashboard 路由重构 + API 集成',
                plan: '1) 完成 SPA 路由和侧栏组件\n2) 完成 System API 集成\n3) 整理 Inbox 笔记 30 条',
                do_: '1) ✅ SPA 框架搭建完成\n2) ✅ API 集成完成\n3) ⏳ 整理了 18 条笔记',
                check: '开发任务完成度高，笔记整理略落后于计划',
                act: '下周继续笔记整理，开始 Service iframe 嵌入功能',
                children: [
                  {
                    id: 'd19', label: '5月19日 周一', type: 'day',
                    summary: '今日计划：多页面 SPA 框架构建',
                    plan: '1) 创建 Vue Router 配置\n2) 创建 8 个 View 页面\n3) 实现 Sidebar 和 Breadcrumb 组件',
                    do_: '进行中...',
                    check: '待复盘',
                    act: '待改进',
                  },
                  {
                    id: 'd20', label: '5月20日 周二', type: 'day',
                    summary: '计划：完善视图内容 + 构建验证',
                    plan: '1) 完善 TodayView 和 OkrView\n2) 构建验证并修复错误\n3) 完成知识库整理 5 条',
                    do_: '待执行',
                    check: '待复盘',
                    act: '待改进',
                  },
                  {
                    id: 'd21', label: '5月21日 周三', type: 'day',
                    summary: '计划：Service 视图 + iframe 集成',
                    plan: '1) ServiceView iframe 嵌入\n2) KbView 文件树组件\n3) 团队同步会议',
                    do_: '待执行',
                    check: '待复盘',
                    act: '待改进',
                  },
                ]
              },
              {
                id: 'w21', label: '第 21 周 (5/19-5/25)', type: 'week',
                summary: '下周计划：Service 嵌入 + 知识库浏览器',
                plan: '1) Service iframe 嵌入\n2) 知识库文件树浏览器\n3) Settings 页面\n4) 笔记整理 30 条',
                do_: '待执行',
                check: '待复盘',
                act: '待改进',
              }
            ]
          },
          {
            id: 'm6', label: '6 月', type: 'month',
            summary: '月度重点：性能优化 + 项目收尾',
            plan: 'Dashboard 性能优化，完成 Q2 项目收尾，准备 Q3 规划',
            do_: '待执行',
            check: '待复盘',
            act: '待改进',
          }
        ]
      },
      {
        id: 'q3', label: 'Q3 (7-9月)', type: 'quarter',
        summary: '季度主题：扩展与深化',
        plan: '移动端适配，API 开放，自动化流程建设',
        do_: '待执行',
        check: '待复盘',
        act: '待改进',
      }
    ]
  }
]

function findPeriod(id: string, list?: Period[]): Period | null {
  const items = list || periods
  for (const p of items) {
    if (p.id === id) return p
    if (p.children) {
      const found = findPeriod(id, p.children)
      if (found) return found
    }
  }
  return null
}

const currentPeriod = computed(() => findPeriod(selected.value))

function typeLabel(t: string) {
  const map: Record<string, string> = { year: '年度', quarter: '季度', month: '月度', week: '周', day: '日' }
  return map[t] || t
}

function isCurrent(id: string) { return id === selected.value }
</script>

<template>
  <div class="pdca">
    <h1 class="page-title">PDCA 看板</h1>
    <p class="page-subtitle">计划 → 执行 → 检查 → 改进</p>

    <div class="pdca-layout">
      <!-- Left: Timeline Tree -->
      <div class="timeline-panel">
        <template v-for="p in periods" :key="p.id">
          <div class="tree-node">
            <div class="tree-item year" :class="{ active: isCurrent(p.id) }" @click="selected = p.id">
              <span class="tree-dot" :class="{ dot: true, active: isCurrent(p.id) }"></span>
              <span class="tree-label">{{ p.label }}</span>
              <span class="tree-type">{{ typeLabel(p.type) }}</span>
            </div>
            <div v-if="p.children" class="tree-children">
              <template v-for="q in p.children" :key="q.id">
                <div class="tree-node">
                  <div class="tree-item quarter" :class="{ active: isCurrent(q.id) }" @click="selected = q.id">
                    <span class="tree-dot" :class="{ active: isCurrent(q.id) }"></span>
                    <span class="tree-label">{{ q.label }}</span>
                  </div>
                  <div v-if="q.children" class="tree-children">
                    <template v-for="m in q.children" :key="m.id">
                      <div class="tree-node">
                        <div class="tree-item month" :class="{ active: isCurrent(m.id) }" @click="selected = m.id">
                          <span class="tree-dot" :class="{ active: isCurrent(m.id) }"></span>
                          <span class="tree-label">{{ m.label }}</span>
                        </div>
                        <div v-if="m.children" class="tree-children">
                          <template v-for="w in m.children" :key="w.id">
                            <div class="tree-node">
                              <div class="tree-item week" :class="{ active: isCurrent(w.id), 'current-week': w.id === 'w20' }" @click="selected = w.id">
                                <span class="tree-dot" :class="{ active: isCurrent(w.id), pulse: w.id === 'w20' }"></span>
                                <span class="tree-label">{{ w.label }}</span>
                              </div>
                              <div v-if="w.children" class="tree-children">
                                <div v-for="d in w.children" :key="d.id" class="tree-item day" :class="{ active: isCurrent(d.id), today: d.id === 'd19' }" @click="selected = d.id">
                                  <span class="tree-dot" :class="{ active: isCurrent(d.id), today: d.id === 'd19' }"></span>
                                  <span class="tree-label">{{ d.label }}</span>
                                </div>
                              </div>
                            </div>
                          </template>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </template>
      </div>

      <!-- Right: Detail Panel -->
      <div class="detail-panel" v-if="currentPeriod">
        <div class="detail-header">
          <span class="detail-type">{{ typeLabel(currentPeriod.type) }}</span>
          <h2 class="detail-title">{{ currentPeriod.label }}</h2>
        </div>
        <p class="detail-summary">{{ currentPeriod.summary }}</p>

        <div class="pdca-cards">
          <div class="pdca-card plan">
            <div class="pdca-label">Plan <span class="pdca-icon">📋</span></div>
            <p class="pdca-text">{{ currentPeriod.plan }}</p>
          </div>
          <div class="pdca-card do">
            <div class="pdca-label">Do <span class="pdca-icon">⚡</span></div>
            <p class="pdca-text">{{ currentPeriod.do_ }}</p>
          </div>
          <div class="pdca-card check">
            <div class="pdca-label">Check <span class="pdca-icon">🔍</span></div>
            <p class="pdca-text">{{ currentPeriod.check }}</p>
          </div>
          <div class="pdca-card act">
            <div class="pdca-label">Act <span class="pdca-icon">🔄</span></div>
            <p class="pdca-text">{{ currentPeriod.act }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pdca { padding-top: 32px; }
.page-title { font-size: 28px; font-weight: 510; letter-spacing: -0.6px; color: var(--text-primary); margin-bottom: 4px; }
.page-subtitle { font-size: 14px; color: var(--text-tertiary); margin-bottom: 24px; }

.pdca-layout { display: grid; grid-template-columns: 280px 1fr; gap: 24px; }

/* Timeline */
.timeline-panel { background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 16px; }
.tree-children { padding-left: 20px; border-left: 1px solid var(--border-subtle); margin-left: 8px; }
.tree-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px; border-radius: 6px; cursor: pointer;
  transition: background 0.15s; margin-bottom: 2px;
}
.tree-item:hover { background: rgba(255,255,255,0.04); }
.tree-item.active { background: rgba(113,112,255,0.1); }
.tree-item.current-week { background: rgba(113,112,255,0.06); }
.tree-item.today { background: rgba(16,185,129,0.06); }
.tree-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--text-quaternary); flex-shrink: 0;
}
.tree-dot.active { background: var(--accent); }
.tree-dot.pulse { background: var(--accent); animation: pulse 2s ease-in-out infinite; }
.tree-dot.today { background: #10b981; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
.tree-label { font-size: 13px; color: var(--text-secondary); }
.tree-item.active .tree-label { color: var(--accent); font-weight: 510; }
.tree-type { font-size: 10px; color: var(--text-quaternary); margin-left: auto; }

.tree-item.year .tree-label { font-weight: 510; font-size: 14px; color: var(--text-primary); }
.tree-item.quarter .tree-label { font-weight: 500; }

/* Detail */
.detail-panel { background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 24px; }
.detail-header { margin-bottom: 16px; }
.detail-type { font-size: 10px; font-weight: 510; color: var(--accent); text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 4px; }
.detail-title { font-size: 22px; font-weight: 510; color: var(--text-primary); letter-spacing: -0.4px; }
.detail-summary { font-size: 14px; color: var(--text-tertiary); margin-bottom: 20px; line-height: 1.6; }

.pdca-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.pdca-card { padding: 16px; border-radius: 10px; border: 1px solid var(--border-subtle); }
.pdca-card.plan { background: rgba(113,112,255,0.04); border-color: rgba(113,112,255,0.1); }
.pdca-card.do { background: rgba(16,185,129,0.04); border-color: rgba(16,185,129,0.1); }
.pdca-card.check { background: rgba(251,191,36,0.04); border-color: rgba(251,191,36,0.1); }
.pdca-card.act { background: rgba(239,68,68,0.04); border-color: rgba(239,68,68,0.1); }
.pdca-label { font-size: 12px; font-weight: 510; color: var(--text-secondary); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
.pdca-icon { font-size: 14px; }
.pdca-text { font-size: 12px; color: var(--text-tertiary); line-height: 1.6; white-space: pre-line; }

@media (max-width: 768px) {
  .pdca-layout { grid-template-columns: 1fr; }
  .pdca-cards { grid-template-columns: 1fr; }
}
</style>
