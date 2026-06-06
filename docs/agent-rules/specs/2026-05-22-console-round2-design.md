# Console 第二轮优化设计

> 日期: 2026-05-22 | 状态: Draft | 范围: 6 项 UI/后端调整

## 背景

Console 第一轮 7 项修复完成后，用户实际使用反馈 6 个问题，涉及侧边栏、知识库、看板、今日页面的交互和内容呈现。

## 变更清单

### 调整 1: 移除服务功能

**问题**: 服务内嵌不可用，用户不需要此功能。

**方案**:
- `src/config/navigation.ts`: 删除"服务"分组及其 5 个导航项
- `src/router/index.ts`: 删除 `/services/:id` 路由
- `src/views/ServiceView.vue`: 删除文件
- `src/config/services.ts`: 删除 `services` 数组，保留 `API_BASE` 和 `bookmarks`
- 后端 `/api/health`: 保留（系统健康探测有独立价值）

### 调整 2: Hermes 知识库目录修复 + 最近编辑

**问题**: 目录点不开；缺少最近编辑文档入口。

**方案**:

2a. 修复目录展开:
- 调试 `FileTree.vue` 的 `toggleDir` 和 `renderTree` 逻辑
- 确认后端 `/api/fs/tree` 返回的 `children` 结构与前端 `item.children` 检查匹配

2b. 新增"最近编辑":
- 后端新增 `GET /api/fs/recent?limit=10`: 递归扫描 KB_ROOT，按 mtime 降序返回最近修改的 `.md` 文件
- 响应格式: `{ files: [{ name, path, mtime, size }] }`
- 前端 `KbView.vue`: 文件树上方新增"最近编辑"区域，点击直接加载文件内容

### 调整 3: Notion 知识库重设计

**问题**: 主题计数显示 0，内容无实质意义。

**方案**:

后端 `/api/notion/knowledge` overview 响应重构:
```json
{
  "stats": {
    "library": { "total": 100, "recentWeek": 3 },
    "material": { "total": 100, "recentWeek": 5 },
    "inspiration": { "total": 100, "recentWeek": 2 },
    "treasure": { "total": 35, "recentWeek": 1 }
  },
  "recent": {
    "library": [{ id, title, category, tags, updated }],
    "material": [...],
    "inspiration": [...],
    "treasure": [...]
  },
  "topicStats": [
    { "name": "产品经理", "count": 575, "recentWeek": 12 },
    ...
  ]
}
```

- `recentWeek`: 最近 7 天创建/更新的条目数（通过 `updated` 日期字段判断）
- `recent`: 每个子库取最近 5 条，含 category/tags/updated
- `topicStats`: 按主题统计总条目数和最近一周新增

前端三段式布局:
1. **顶部**: 4 个统计卡片，显示"总数 / 本周新增"
2. **中部**: 4 列布局，每列一个子库的最近 5 条（标题 + 标签 + 更新时间）
3. **底部**: 主题分类统计，水平条形图显示每个主题的条目数占比

### 调整 4: PDCA 仅显示当前周期

**问题**: 列举所有历史数据，信息过载。

**方案**:

后端新增 `GET /api/notion/pdca/current`:
- 根据当前日期计算: 当前周(ISO week)、当前月、当前季度
- 从 timeline 数据中匹配:
  - P(计划): 当前周计划 + 当前月计划 + 当前季度计划
  - D(执行): 当前待办 (priority 1st/2nd, 不变)
  - C(检查): 当前周的日复盘(最近 7 天) + 当前周复盘
  - A(行动): 当前月复盘 + 当前季度复盘
- 匹配逻辑: 比较各 period 的 `date` 字段是否落在对应时间区间内

前端 `PdcaView.vue`: 数据源从 `fetchPdcaTimeline` 改为 `fetchPdcaCurrent`（新增 composable 方法）

### 调整 5: OKR 项目标题显示不全

**问题**: CSS `text-overflow: ellipsis` + `white-space: nowrap` 截断项目标题。

**方案**:
- `OkrView.vue` 中 `.project-title` 样式: 移除 `white-space: nowrap`，改为允许换行
- 项目标题完整显示，容器高度自适应

### 调整 6: 今日页面优化

**问题**: 内容过长导致下方内容被遮挡；缺少筛选。

**方案**:

布局调整:
- 保持左右两栏
- 待办和任务各限制默认显示 5 条
- 底部"查看全部"按钮展开剩余条目
- 习惯追踪和日复盘区域始终可见（不需要滚动）

筛选条件:
- **待办筛选**: 优先级(1st/2nd/3rd)、类别(工作/非工作/全部)、状态
- **任务筛选**: 状态(进行中/待开始/已完成/暂停/全部)
- 筛选栏位于每个区域标题右侧，下拉或 pill 按钮

## 文件变更范围

| 文件 | 变更类型 |
|------|----------|
| `src/config/navigation.ts` | 修改 - 删除服务分组 |
| `src/config/services.ts` | 修改 - 删除 services 数组 |
| `src/router/index.ts` | 修改 - 删除 service 路由 |
| `src/views/ServiceView.vue` | 删除 |
| `src/components/FileTree.vue` | 修改 - 修复展开 |
| `src/views/KbView.vue` | 修改 - 新增最近编辑区 |
| `src/views/KnowledgeView.vue` | 重写 - 三段式布局 |
| `src/views/PdcaView.vue` | 修改 - 数据源切换 |
| `src/views/OkrView.vue` | 修改 - 项目标题样式 |
| `src/views/TodayView.vue` | 修改 - 条数限制 + 筛选 |
| `src/composables/useNotion.ts` | 修改 - 新增 fetchPdcaCurrent |
| `console-api/server.mjs` | 修改 - 新增 3 个端点 |
| `console-api/services/notion.mjs` | 修改 - 新增辅助方法 |

## 新增后端端点

| 端点 | 说明 |
|------|------|
| `GET /api/fs/recent?limit=10` | 最近编辑文件列表 |
| `GET /api/notion/pdca/current` | 当前周期 PDCA 数据 |
| `/api/notion/knowledge` overview | 重构响应格式 |

## 验收标准

1. 侧边栏无"服务"分组
2. 知识库目录可展开，有"最近编辑"区域
3. Notion 知识库显示正确计数 + 本周新增 + 最近条目 + 主题统计
4. PDCA 仅显示当前周/月/季度的计划和复盘
5. OKR 项目标题完整显示
6. 今日页面每区默认 5 条，筛选功能可用
7. `npm run build` 通过
8. 后端 `node --test tests/*.mjs` 全部通过
