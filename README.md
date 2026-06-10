# Console — 个人数字中心

Console 是一个面向个人使用的数字中心，整合 Notion 工作流、PARA 知识框架、课程学习系统、Hermes 本地知识库和自托管服务入口。

项目为 Vue 3 + Vite + TypeScript 单页应用，后端由独立的 `console-api` 服务提供。

## 项目目标

1. **统一入口**：把 OKR、PDCA、知识库、学习中心和常用工具集中到一个界面。
2. **知识管理**：基于 PARA 框架组织个人知识体系，关联 Notion 知识库与 NAS 电子书。
3. **课程学习**：内置 PDF/Markdown 阅读器，支持笔记、高亮、进度追踪的完整学习系统。
4. **快速查阅**：直接浏览 Hermes 本地知识库与课程化学习内容。

## 当前实现状态

| 模块 | 路由 | 状态 | 说明 |
|------|------|------|------|
| 首页仪表盘 | `/` | ✅ 已实现 | 聚合今日摘要、OKR、PDCA、知识动态、系统状态、服务入口和工具书签 |
| 今日概览 | `/today` | ✅ 已实现 | 展示今日待办、任务、习惯和日复盘，支持筛选和展开查看 |
| OKR 看板 | `/okr` | ✅ 已实现 | 按领域、目标、关键结果、项目展示目标层级和进度 |
| PDCA 看板 | `/pdca` | ✅ 已实现 | 聚焦当前周期的计划、执行、检查和行动信息 |
| Notion 知识库 | `/knowledge` | ✅ 已实现 | 展示图书馆、资料、灵感、宝藏库的统计、最近条目和主题分布 |
| Hermes 知识库 | `/kb` | ✅ 已实现 | 浏览本地知识库文件树，阅读 Markdown，并支持文件管理操作 |
| **PARA Areas** | `/areas` | ✅ **已重写** | **三 Tab 结构：概览(含课程+Notion知识) / 课程目录 / 全部书籍** |
| 学习中心 | `/learn` | ✅ 已实现 | 展示课程目录、学习进度、课时详情和复习提醒 |
| 设置 | `/settings` | ⏳ 占位 | 预留个性化设置入口 |

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

### PARA Areas（新增课程系统 ⭐）

Areas 页面是个人知识管理的核心入口，采用三 Tab 结构：

**📂 概览 Tab**
- 展示所有 PARA 领域卡片（来源于 OKR 领域定义）
- 点击展开查看该领域的课程列表
- 展开后显示关联的 **Notion 知识库**数据（图书馆/资料/灵感/宝藏）

**📚 课程 Tab**
- 按领域分组的课程目录
- 支持按领域筛选（过滤按钮）
- 点击课程展开查看关联的 **NAS 电子书**
- 支持一键跳转到学习中心

**📖 书籍 Tab**
- NAS 全部电子书（分页浏览）
- 按书名模糊搜索
- 一键扫描 NAS 书籍目录

### 课程学习系统 ⭐

基于 PARA 框架的完整学习系统，包含：

**PDF 阅读器**
- PDF.js 内置阅读器
- 翻页导航、缩放控制
- 阅读进度条
- 文本选中自动触发高亮

**Markdown 阅读器**
- 渲染 GitHub README 等内容
- 深色/浅色主题自适应

**笔记系统**
- 章节笔记：阅读时记录要点
- 读后感：整体感悟总结
- 自动保存（3 秒 / 5 秒间隔）
- Markdown 编辑工具栏
- 笔记导出为 Markdown 文件

**高亮管理**
- 选中文本自动添加高亮
- 高亮列表展示
- 支持删除

**间隔复习（SM-2）**
- 阅读进度自动追踪
- SM-2 复习结果记录
- 到期复习提醒

### 课程数据源

| 来源 | 说明 | 当前数据 |
|------|------|---------|
| NAS 电子书 | 自动扫描 `/volume1/books/` | **224 本** 已索引 |
| Notion 图书馆 | 自动关联到对应领域 | **100 条** 阅读记录 |
| GitHub 开源课程 | 手动配置 + 一键推荐 | **5 门** 推荐课程 |

### 种子课程（自动创建）

| 领域 | 课程数 | 示例课程 |
|------|:------:|---------|
| 产品经理 | 3 门 | 产品经理基础、战略与商业模式、用户体验设计 |
| 研发效能 | 4 门 | Java 核心技术、Web 开发、数据库与存储、系统架构 |
| 经济理财 | 2 门 | 理财入门、经济学原理 |
| 团队管理 | 1 门 | 领导力与团队管理 |
| 技术创新 | 1 门 | 人工智能与机器学习 |
| 职业发展 | 1 门 | 职业规划与成长 |
| 家庭生活 | 1 门 | 家庭与生活 |
| 身体健康 | 1 门 | 健康与生活方式 |

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
- 间隔复习提醒（SM-2）
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
| `/areas` | AreasView | **PARA 领域概览 + 课程系统 + 书籍浏览** |
| `/learn` | LearnView | 学习中心 |
| `/settings` | SettingsView | 设置占位页 |

## 技术栈

- Vue 3.5 + Vite 6 + TypeScript
- Vue Router 4
- PDF.js（内置 PDF 阅读器）
- Fastify (console-api 后端)
- SQLite（本地笔记、进度、课程数据存储）
- CSS Variables + Linear 风格深色设计系统

设计 Token 主要定义在：

- `src/styles/variables.css`
- `src/styles/global.css`

## 数据源与后端依赖

本仓库只包含前端 SPA。运行完整功能需要配合独立后端 `console-api`。

前端主要依赖以下 API：

### 学习系统 API（新增 ⭐）

| API | 说明 |
|-----|------|
| `GET /api/courses/grouped` | 按领域分组的课程列表 |
| `GET /api/courses/area/:id` | 特定领域的课程 |
| `POST /api/courses` | 创建课程 |
| `PUT /api/courses/:id` | 更新课程 |
| `DELETE /api/courses/:id` | 删除课程 |
| `GET /api/courses/:id/books` | 课程的关联书籍 |
| `POST /api/courses/:id/books` | 关联书籍到课程 |
| `POST /api/courses/seed` | 自动创建种子课程 |
| `POST /api/books/index` | 索引 NAS 电子书 |
| `GET /api/books/search` | 搜索电子书 |
| `GET /api/books/:id/view` | 在线阅读 |
| `GET /api/books/:id/raw` | 下载原始文件 |
| `GET /api/books/recent` | 最近索引的书籍 |
| `GET /api/learning/progress/:course_id` | 学习进度 |
| `PUT /api/learning/progress` | 更新进度 |
| `GET /api/learning/notes/:course_id` | 获取笔记 |
| `POST /api/learning/notes` | 创建笔记 |
| `PUT /api/learning/notes/:id` | 更新笔记 |
| `DELETE /api/learning/notes/:id` | 删除笔记 |
| `GET /api/learning/highlights/:course_id` | 获取高亮 |
| `POST /api/learning/highlights` | 添加高亮 |
| `GET /api/learning/notes/export/:course_id` | 导出笔记为 Markdown |
| `POST /api/learning/review` | 记录复习结果 |
| `GET /api/github/courses` | GitHub 开源课程列表 |
| `POST /api/github/courses/seed` | 添加推荐课程 |
| `GET /api/knowledge/library/areas` | 按领域分组的 Notion 知识库 |
| `GET /api/knowledge/area/:name` | 特定领域的全部 Notion 知识 |

### 现有 API

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
├── views/               # 9 个页面组件
├── components/          # 通用组件（含新增学习组件）
│   ├── CourseReader.vue # 📖 统一阅读器（PDF + 笔记 + 高亮）
│   ├── PdfViewer.vue    # 📄 PDF.js 阅读器
│   ├── NoteEditor.vue   # 📝 笔记编辑器
│   ├── MarkdownViewer.vue
│   └── ... (现有组件)
├── composables/         # API 调用与状态封装
│   ├── useAreaCourses.ts # 🆕 课程系统 API
│   ├── useBooks.ts       # 🆕 书籍索引 API
│   ├── useLearning.ts    # 🆕 学习笔记 API
│   └── ... (现有 composables)
├── config/              # 导航、服务、书签和 API 配置
└── styles/              # 全局样式与设计变量
```

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

数据库（SQLite）位于 `console-api/data/console.db`，包含：
- `books_index` — NAS 电子书索引
- `courses` — 课程定义
- `course_books` — 课程-书籍关联
- `learning_progress` — 学习进度
- `learning_notes` — 学习笔记
- `learning_highlights` — 文本高亮
- `github_courses` — GitHub 开源课程

## Docker 部署

```bash
docker compose -f /root/.hermes/projects/docker-compose.yml build console-api console
docker compose -f /root/.hermes/projects/docker-compose.yml up -d console-api console
```

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
NAS Docker 服务
  ├── console — Nginx 托管前端静态资源 (3200)
  └── console-api — Node.js Fastify 接口 (3300)
```

NAS 目录挂载：
- `/volume1/books` — 电子书（只读）
- `/root/.hermes/knowledge` — 知识库（只读）
- `/root/.hermes/courses` — 课程数据

## 设计原则

- **单用户优先**：面向个人工作流，不做复杂多租户和权限系统。
- **只读优先**：Notion 数据以读取和展示为主，避免误写核心工作流数据。
- **Token 不进前端**：Notion Token 等敏感配置只存在于后端。
- **路径白名单**：本地文件访问限制在知识库根目录内。
- **渐进增强**：不可用的数据源不应阻塞其他 Widget 渲染。
- **深色界面**：采用 Linear 风格深色设计系统。
- **本地优先笔记**：笔记存储在 SQLite，不同步到 Notion。

## 相关文档

- `../knowledge/projects/console/02-requirements/requirements-spec.md` — 原始需求规格
- `../knowledge/projects/console/03-design/architecture-design.md` — 架构设计
- `docs/agent-rules/specs/2026-06-09-learning-system-integration-design.md` — 学习系统设计文档
- `docs/agent-rules/plans/2026-06-09-learning-system-integration-plan.md` — 学习系统实现计划
- `docs/learning-system-user-guide.md` — 学习系统用户使用说明
