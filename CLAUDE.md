# Console — 个人数字中心

## 项目概述

个人数字中心，统一管理 OKR/PDCA/知识库/自托管服务。前端 Vue 3 + Vite + TypeScript SPA，后端 Node.js Fastify API。

## 架构

- **前端**: Vue 3.5 + Vite 6.4 + Vue Router 4 + TypeScript
- **后端**: Fastify + systeminformation (运行在 NAS :3300)
- **数据源**: Notion API (通过后端代理) + NAS 系统指标 + 本地知识库文件
- **部署**: Docker on NAS → FRP 隧道 → ECS Nginx → console.ygxpro.online

## 核心设计文档

以下文档定义了完整的产品需求和技术架构：

- `../knowledge/projects/console/02-requirements/requirements-spec.md` — 需求规格 v1.0 (FR-01~FR-10)
- `../knowledge/projects/console/03-design/architecture-design.md` — 架构设计 v3.1 (路由、Widget、侧边栏、API)
- `../knowledge/projects/console/04-implementation/implementation-plan.md` — 实现计划 (4阶段23任务)

## 页面路由 (8个)

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | DashboardView | 首页仪表盘：问候+今日摘要+OKR+PDCA+知识动态+系统状态+服务网格+书签 |
| `/today` | TodayView | 今日概览：待办+任务+习惯+日复盘 |
| `/okr` | OkrView | OKR看板：领域→目标→KR→项目，三层折叠面板 |
| `/pdca` | PdcaView | PDCA看板：年→季→月→周→日时间线+详情 |
| `/knowledge` | KnowledgeView | Notion知识库：主题概览+4 Tab子库列表 |
| `/kb` | KbView | Hermes知识库浏览器：文件树+Markdown渲染 |
| `/services/:id` | ServiceView | 服务iframe内嵌，5s超时降级 |
| `/settings` | SettingsView | 设置（远期） |

## 侧边栏设计

- 展开态 240px (emoji+文字) / 折叠态 64px (仅emoji)
- 5个分组：概览 / 工作 / 知识 / 服务 / 底部设置
- 当前路由高亮，底部折叠按钮

## 设计风格

Linear 深色设计系统：
- 背景: #08090a (canvas) / #0f1011 (panel) / #191a1b (surface)
- 强调色: #7170ff (accent)
- 字体: Inter + JetBrains Mono
- 变量定义在 `src/styles/variables.css`

## 文件结构

```
src/
├── App.vue              # 主布局 (侧边栏 + router-view)
├── main.ts              # 入口
├── router/index.ts      # 路由配置
├── views/               # 8个页面组件
├── components/          # 通用组件 (Sidebar, Breadcrumb, MetricBar, ServiceCard, etc.)
├── composables/         # useNotion, useSystem, useServices, useKnowledgeBase
├── config/              # services.ts, navigation.ts, api.ts
└── styles/              # variables.css, global.css
```

## 后端 API (console-api/)

已有:
- GET /api/system — CPU/内存/磁盘/Docker
- GET /api/health — 服务健康探测

待开发:
- GET /api/notion/* — Notion 数据代理 (today/okr/week/knowledge/dashboard/pdca/timeline)
- GET /api/fs/tree — 知识库目录树
- GET /api/fs/file — 知识库文件内容 (md→HTML)

## 环境约束

- NAS Python 3.8，不支持 X | Y 语法
- 后端只用 Node.js，不用 Python
- NAS 无 pip，npm 需 .npmrc `include=dev`
- Vite 版本 pin ^6.3.5
- execute_code 内 read_file 返回空内容，用 terminal("cat path")

## 开发命令

```bash
cd /root/.hermes/projects/console
npm run dev     # 开发服务器
npm run build   # 生产构建
```

```bash
cd /root/.hermes/projects/console-api
node server.mjs # API 服务器 :3300
```

## Notion 数据库 IDs

- OKR: 领域(91e23617), 目标(1d70b25e), KR(76a77973), 项目(374ac64d), 任务(cbe3188c)
- PDCA: 待办(5c0f7915), 日(2bd7772a), 周(345f5210), 月(da80ff53), 季(38195be0), 年(137deda2)
- 知识: 主题(e4a90d63), 图书馆(0b2e9016), 资料(5680a87f), 灵感(4c4aeb0f), 宝藏(f93e7e3e)
- 习惯: 1a9efc2b

## 当前状态

- 前端有探索原型（单页面首页，无 Router/Sidebar/多页面）
- 后端 API 有 system + health 接口
- 需要按架构设计文档重新执行完整开发
