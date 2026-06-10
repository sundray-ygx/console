# Console 剩余方向统一推进计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 Console 蓝图的三个剩余方向：Retrieval Practice、PARA Integration、Learn Stats/Streak Tracking。三个方向独立可执行，统一部署验证。

**Architecture:** 前端 Vue 3 SPA（`/root/.hermes/projects/console`）+ 后端 Fastify API（`/root/.hermes/projects/console-api`）。前端改动集中在视图/组件层；后端改动为新增 API 端点。

**Tech Stack:** Vue 3.5 + TypeScript + Vite 6 (前端), Node.js Fastify + systeminformation (后端), Docker Compose 部署。

---

## Direction A: Retrieval Practice — 课时 Recall 练习

**目标**：在 LessonDetail 中增加 Recall Prompts 区，阅读后主动回忆，标记掌握状态。

### 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/LessonDetail.vue` | 修改 | 在练习区域后增加 Recall Prompts 区 |
| `src/composables/useCourses.ts` | 修改 | 无需改动（LessonProgress 已含 SM-2 字段） |

### Task A1: 添加 Recall Prompts 组件

在 `LessonDetail.vue` 中 exercises 后添加 Recall Prompts 区域，使用 lesson 现有的 exercises、key_notes、deep_content 自动生成 recall prompts：

- 从 `lesson.exercises` → 练习问题作为 Recall Q
- 从 `lesson.key_notes` → 段落拆分为 Recall 点
- 每条 prompt 可展开查看答案
- 每条 prompt 可标记「已掌握」或「需复习」
- 标记「需复习」→ 通过 `POST /api/learn/reviews/result` 记录 `outcome: 'again'`
- 标记「已掌握」→ 记录 `outcome: 'good'`

**Acceptance:**
- 课时有 exercises 或 key_notes 时显示 Recall 区
- 点击「展开答案」显示对应内容
- 点击「已掌握」→ 绿色反馈 + 自动记录 good
- 点击「需复习」→ 红色反馈 + 自动记录 again

---

## Direction B: PARA Integration — Areas/Resources 统一视图

**目标**：引入 AREA 概念（责任领域），统一侧边栏 Knowledge 分组为 Resources 视图。

### 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/config/navigation.ts` | 修改 | 在 Knowledge 下增加「Areas」入口 |
| `src/router/index.ts` | 修改 | 新增 `/areas` 路由（或嵌入现有页面） |
| `src/views/AreasView.vue` | 创建 | 责任领域概览页面 |
| `src/composables/useAreas.ts` | 创建 | 获取 Areas 数据的 composable |
| `src/components/Sidebar.vue` | 修改 | 添加 Knowledge 下的 Areas 子导航（如需要） |
| `console-api/server.mjs` | 修改 | 新增 `/api/areas` 端点，聚合 OKR 领域+课程标签 |

### Task B1: 后端 Areas 聚合端点

在 `console-api/server.mjs` 中新增 `GET /api/areas`：

```json
{
  "areas": [
    {
      "id": "area-work",
      "name": "工作",
      "icon": "💼",
      "source": "okr_domain",
      "itemCount": 12,
      "children": [
        { "id": "work-ai", "name": "AI Native", "type": "resource", "count": 5 },
        { "id": "work-ipd", "name": "IPD", "type": "resource", "count": 3 }
      ]
    },
    {
      "id": "area-tech",
      "name": "技术",
      "icon": "🔧",
      "source": "course_tag",
      "itemCount": 8,
      "children": [
        { "id": "tech-arch", "name": "架构", "type": "course", "count": 4 },
        { "id": "tech-cicd", "name": "CICD", "type": "course", "count": 2 }
      ]
    }
  ]
}
```

数据来源：
- OKR 领域的 category + 名称 → Areas
- 课程 tags → Area children
- Notion 知识主题 → Resources

**Acceptance:**
- `curl http://localhost:3300/api/areas` 返回 JSON
- 至少包含从 OKR 领域派生的 Areas
- 包含从课程 tags 派生的资源关联

### Task B2: 前端 Areas View

创建 `src/views/AreasView.vue`：
- 每个 Area 显示为卡片
- Area 内子项可点击
- 点击 Resource → 跳转 `/knowledge` 或 `/kb`
- 点击 Course → 跳转 `/learn` 对应课程
- 带加载/空/错误状态

创建 `src/composables/useAreas.ts`：
- `fetchAreas()` → `GET /api/areas`
- 标准 loading/error 状态管理

**Acceptance:**
- `/areas` 路由可访问
- 显示 OKR 领域衍生的 Areas
- 课程标签作为子项显示
- 点击子项跳转正确页面

### Task B3: 更新导航

修改 `src/config/navigation.ts`：
- Knowledge 分组下增加「Areas」导航项

---

## Direction C: Learn Stats / Streak Tracking

**目标**：跟踪每日学习活动，在 Dashboard 显示连续学习天数和统计。

### 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `console-api/server.mjs` | 修改 | 新增 streak 存储和 `/api/learn/stats` 端点 |
| `src/composables/useCourses.ts` | 修改 | 新增 LearnStats 接口 |
| `src/components/LearnDashboard.vue` | 修改 | 增加 Streak 和 Stats Widget |

### Task C1: 后端 Streak Tracking

在 `console-api/server.mjs` 中新增：

- `POST /api/learn/stats/tick` — 记录当天学习活动（课程切换、复习、阅读都算）
- `GET /api/learn/stats` — 返回 streak 统计

Streak 存储格式（存为 `COURSES_ROOT` 下的 `_stats.json`）：

```json
{
  "streak": {
    "current": 5,
    "longest": 12,
    "days": ["2026-06-03", "2026-06-04", "2026-06-05", "2026-06-06", "2026-06-07"]
  },
  "totalDays": 47,
  "totalReviews": 89,
  "totalReads": 156,
  "lastActivity": "2026-06-07"
}
```

逻辑：
- `tick` 每次被调用时：查今天是否已记录 → 未记录则追加日期 → 重新计算 streak
- Streak = 从今天往前数连续天数
- `GET /api/learn/stats` 同时从 courses dashboard 数据中拉取 totalReads/totalReviews

**Acceptance:**
- `POST /api/learn/stats/tick` 返回 `{ ok: true, streak: 5 }`
- `GET /api/learn/stats` 返回包含 streak、totalDays、totalReviews 的 JSON
- 连续记录天数正确计算 streak

### Task C2: 前端 Streak Widget

在 `LearnDashboard.vue` 中新增 Streak 区域：
- 显示当前连续天数（🔥 N 天）
- 显示最长连续记录
- 显示总学习天数
- 显示总复习次数
- 作为第二个 stat-hero 卡片

**Acceptance:**
- Dashboard 显示 streak 信息
- 无数据时显示「开始你的第一次学习」
- API 失败不影响其他 Dashboard Widget

---

## 依赖关系

```
Direction A (Retrieval Practice) — 独立，无外部依赖
Direction B (PARA Integration) — 依赖后端新端点
Direction C (Streak Tracking) — 依赖后端新端点
```

三个方向可并行执行，但需按此顺序部署验证：
1. 先做完 C1（后端）→ A（仅前端）+ B2/B3（前端）/ C2（前端）
2. 统一部署 frontend + backend
3. 验证

## 验收总检查

所有方向完成后统一验证：

### 前端 Build
```bash
npm run build
```
Expected: `✓ built in < 10s`, exit 0

### 后端语法
```bash
cd /root/.hermes/projects/console-api
node --check server.mjs
```
Expected: exit 0

### 部署
```bash
docker compose -f /root/.hermes/projects/docker-compose.yml build console-api console
docker compose -f /root/.hermes/projects/docker-compose.yml up -d console-api console
```

### API 验证
```bash
curl http://localhost:3300/api/areas
curl http://localhost:3300/api/learn/stats
curl -X POST http://localhost:3300/api/learn/stats/tick
```

### 前端验证
- `/areas` → HTTP 200, 显示区域卡片
- `/learn` → HTTP 200, 显示 Streak
- `/learn?course=xxx` → 课时详情含 Recall Prompts

### 公网验证
```bash
curl https://console.ygxpro.online/areas
curl https://console.ygxpro.online/learn
```

### 归档
```bash
git add ... && git commit -m "feat: complete remaining directions" && git push origin master:main
```
