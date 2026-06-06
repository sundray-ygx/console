# Console — 个人数字中心

Console 是一个面向个人使用的数字中心，目标是把 Notion 工作流、Hermes 本地知识库、学习资料和常用自托管服务入口整合到一个统一的 Web 控制台中。

项目当前为 Vue 3 + Vite + TypeScript 单页应用，后端能力由独立的 `console-api` 服务提供。

## 项目目标

Console 主要解决三个问题：

1. **统一入口**：把 OKR、PDCA、知识库、学习中心和常用工具集中到一个界面。
2. **信息聚合**：首页汇总今日事项、目标进度、复盘计划、知识动态和系统状态。
3. **快速查阅**：直接浏览 Hermes 本地知识库与课程化学习内容，减少在多个系统之间切换。

## 当前实现状态

| 模块 | 路由 | 状态 | 说明 |
|------|------|------|------|
| 首页仪表盘 | `/` | 已实现 | 聚合今日摘要、OKR、PDCA、知识动态、系统状态、服务入口和工具书签 |
| 今日概览 | `/today` | 已实现 | 展示今日待办、任务、习惯和日复盘，支持筛选和展开查看 |
| OKR 看板 | `/okr` | 已实现 | 按领域、目标、关键结果、项目展示目标层级和进度 |
| PDCA 看板 | `/pdca` | 已实现 | 聚焦当前周期的计划、执行、检查和行动信息 |
| Notion 知识库 | `/knowledge` | 已实现 | 展示图书馆、资料、灵感、宝藏库的统计、最近条目和主题分布 |
| Hermes 知识库 | `/kb` | 已实现 | 浏览本地知识库文件树，阅读 Markdown，并支持文件管理操作 |
| 学习中心 | `/learn` | 已实现 | 展示课程目录、学习进度、课时详情和复习提醒 |
| 设置 | `/settings` | 占位 | 预留个性化设置入口 |

> 说明：原设计中的 `/services/:id` iframe 服务内嵌页已移除。当前服务能力以首页服务卡片和外部链接入口为主。

## 功能概览

### 首页仪表盘

首页是个人工作台，聚合多个数据源：

- 问候语、日期和时间
- 今日待办、任务、习惯完成情况
- OKR 目标进度摘要
- 当前周期 PDCA 摘要
- Notion 知识库最近动态
- NAS 系统状态
- 自托管服务快捷入口
- 常用工具书签

### 今日概览

今日页聚焦当天执行：

- 待办清单：按优先级、类别和状态筛选
- 任务清单：按任务状态筛选
- 习惯追踪：只读展示当天习惯完成情况
- 日复盘：展示当天安排和复盘内容

### OKR 看板

OKR 页用于查看目标体系：

- 领域 → 目标 → 关键结果 → 项目
- 支持按目标状态筛选
- 关键结果和项目以进度条展示完成情况
- 项目标题支持完整换行展示

### PDCA 看板

PDCA 页用于查看当前计划复盘链路：

- P：当前周、月、季度计划
- D：当前执行事项
- C：近期日复盘和周复盘
- A：月度、季度复盘后的行动项

当前实现避免展示过多历史数据，优先服务于当下周期的执行与复盘。

### Notion 知识库

Notion 知识库页汇总个人知识资产：

- 图书馆
- 资料搜集
- 灵感与文档
- 宝藏库
- 知识主题统计
- 最近更新条目

所有 Notion 数据都通过后端代理读取，前端不直接持有 Notion Token。

### Hermes 知识库浏览器

Hermes 知识库页用于浏览本地文件知识库：

- 文件树浏览
- Markdown 阅读
- 最近编辑文档入口
- 文件树面板收缩状态持久化
- 文件上传、下载、新建目录、重命名、删除等管理操作

文件操作由后端限制在知识库根目录内，避免路径穿越。

### 学习中心

学习中心把资料组织为课程化结构：

- 学习总览仪表盘
- 课程目录
- 章节与课时树
- 课时详情
- 学习状态更新
- 复习提醒
- URL query 同步当前课程、章节和课时位置

## 路由表

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | DashboardView | 首页仪表盘 |
| `/today` | TodayView | 今日概览 |
| `/okr` | OkrView | OKR 看板 |
| `/pdca` | PdcaView | PDCA 看板 |
| `/knowledge` | KnowledgeView | Notion 知识库 |
| `/kb` | KbView | Hermes 知识库浏览器 |
| `/learn` | LearnView | 学习中心 |
| `/settings` | SettingsView | 设置占位页 |

## 技术栈

- Vue 3.5
- Vite 6
- TypeScript
- Vue Router 4
- CSS Variables
- Linear 风格深色设计系统

设计 Token 主要定义在：

- `src/styles/variables.css`
- `src/styles/global.css`

## 数据源与后端依赖

本仓库只包含前端 SPA。运行完整功能需要配合独立后端 `console-api`。

前端主要依赖以下 API：

| API | 说明 |
|-----|------|
| `GET /api/notion/dashboard` | 首页聚合数据 |
| `GET /api/notion/today` | 今日待办、任务、习惯和日复盘 |
| `GET /api/notion/okr` | OKR 层级数据 |
| `GET /api/notion/week` | 当前周 PDCA 摘要 |
| `GET /api/notion/pdca/current` | 当前周期 PDCA 数据 |
| `GET /api/notion/knowledge` | Notion 知识库数据 |
| `GET /api/fs/tree` | Hermes 知识库文件树 |
| `GET /api/fs/recent` | 最近编辑文件 |
| `GET /api/fs/file` | 文件内容或文件信息 |
| `POST /api/fs/upload` | 上传文件 |
| `GET /api/fs/download` | 下载文件 |
| `POST /api/fs/mkdir` | 新建目录 |
| `POST /api/fs/rename` | 重命名文件或目录 |
| `DELETE /api/fs/file` | 删除文件或空目录 |
| `GET /api/courses/catalog` | 学习中心课程目录 |
| `GET /api/courses/dashboard` | 学习进度总览 |
| `GET /api/courses/review-due` | 到期复习列表 |
| `GET /api/courses/:id` | 课程详情 |
| `POST /api/courses/:id/progress` | 更新课时学习状态 |
| `GET /api/system` | NAS 系统状态 |
| `GET /api/health` | 服务健康探测 |

## 项目结构

```text
src/
├── App.vue              # 主布局：侧边栏 + router-view
├── main.ts              # 应用入口
├── router/              # Vue Router 配置
├── views/               # 页面组件
├── components/          # 通用组件和页面子组件
├── composables/         # API 调用与状态封装
├── config/              # 导航、服务、书签和 API 配置
└── styles/              # 全局样式与设计变量
```

关键文件：

| 文件 | 说明 |
|------|------|
| `src/router/index.ts` | 路由定义 |
| `src/config/navigation.ts` | 侧边栏导航结构 |
| `src/config/services.ts` | API 基础路径、服务入口和工具书签 |
| `src/composables/useNotion.ts` | Notion 代理 API 调用 |
| `src/composables/useKnowledgeBase.ts` | Hermes KB 文件 API 调用 |
| `src/composables/useCourses.ts` | 学习中心课程 API 调用 |

## 本地开发

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

构建生产版本：

```bash
npm run build
```

本地预览生产构建：

```bash
npm run preview
```

## 后端运行

完整功能需要另行启动后端服务：

```bash
cd /root/.hermes/projects/console-api
node server.mjs
```

默认后端服务运行在 NAS 的 `:3300` 端口，前端通过同源 `/api/*` 路径访问。

## 部署说明

目标部署链路：

```text
Browser
  ↓
console.ygxpro.online
  ↓
ECS Nginx + SSL
  ↓
FRP 隧道
  ↓
NAS Docker / Node.js 服务
  ├── Console 前端静态资源
  └── console-api 后端接口
```

一期为单用户个人系统，不内置登录认证。访问控制依赖内网、FRP、域名和上游网关策略。

## 设计原则

- **单用户优先**：面向个人工作流，不做复杂多租户和权限系统。
- **只读优先**：Notion 数据以读取和展示为主，避免误写核心工作流数据。
- **Token 不进前端**：Notion Token 等敏感配置只存在于后端。
- **路径白名单**：本地文件访问限制在 Hermes 知识库根目录内。
- **渐进增强**：不可用的数据源不应阻塞其他 Widget 渲染。
- **深色界面**：采用 Linear 风格深色设计系统。

## 与原始需求的主要差异

相较于最初需求文档，当前实现有几处调整：

1. **移除服务 iframe 内嵌页**：`/services/:id` 和 `ServiceView.vue` 已删除，服务入口改为首页快捷卡片。
2. **新增学习中心**：新增 `/learn` 路由，用于课程化资料浏览和学习进度管理。
3. **Hermes KB 增强**：从只读 Markdown 浏览扩展为带文件管理能力的知识库浏览器。
4. **PDCA 聚焦当前周期**：避免历史数据过载，优先展示当前周、月、季度相关内容。
5. **Notion 知识库重设计**：从简单列表调整为统计卡片、最近条目和主题分布结合的概览页。

## 相关文档

- `../knowledge/projects/console/02-requirements/requirements-spec.md` — 原始需求规格
- `../knowledge/projects/console/03-design/architecture-design.md` — 架构设计
- `docs/agent-rules/specs/2026-05-22-console-round2-design.md` — 第二轮优化设计
- `docs/agent-rules/specs/2026-05-22-console-sidebar-kb-enhancement-design.md` — 侧边栏与 KB 增强设计
