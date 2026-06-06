# Console 侧边栏持久化 + Hermes 知识库增强

> 日期: 2026-05-22 | 状态: Draft | 类型: Feature

## 概述

三项增强：侧边栏折叠状态持久化、Hermes 知识库文件树面板收缩、知识库文件管理（上传/下载/新建/重命名/删除）。

## 设计决策

- 侧边栏折叠状态用 localStorage 持久化，key 为 `console-sidebar`
- 知识库面板收缩状态用 localStorage 持久化，key 为 `console-kb-tree-collapsed`
- 文件管理采用方案 A（后端新增 REST API + 前端叠加操作 UI），不引入第三方文件管理库
- 所有文件操作限制在 KB_ROOT (`/root/.hermes/knowledge/`) 内，防止路径遍历

## Part 1: 侧边栏折叠持久化

**改动文件**: `src/App.vue`

- `sidebarExpanded` 初始值从 `localStorage.getItem('console-sidebar')` 读取（默认 `'true'`）
- toggle 时同步写入 localStorage
- 约 3 行改动

## Part 2: Hermes 知识库面板收缩

**改动文件**: `src/views/KbView.vue`

- 新增 `treeCollapsed` ref，从 `localStorage.getItem('console-kb-tree-collapsed')` 读取
- 展开: `grid-template-columns: 280px 1fr`
- 收缩: `grid-template-columns: 1fr`，文件树面板隐藏
- 收缩时 Markdown 面板顶部显示"展开文件树"按钮
- 展开时文件树面板顶部显示"收缩"按钮
- 切换时同步写入 localStorage

## Part 3: 文件管理功能

### 后端依赖

- 新增 `@fastify/multipart` 用于处理文件上传

### 文件树显示范围

当前 `buildTree` 仅显示 `.md` 文件。改为显示所有文件类型，但 `.md` 文件在 Markdown 预览区渲染，非 `.md` 文件点击后显示文件信息（大小、类型）并提供下载按钮。

### 后端 API

所有端点在 `console-api/server.mjs` 中新增。统一路径安全校验：resolve 后必须在 `KB_ROOT` 下。所有端点的错误响应格式：`{ error: string }`，HTTP 状态码如下所述。

```
POST /api/fs/upload
  Content-Type: multipart/form-data
  Body: { file: File, targetDir: string }
  同名文件追加时间戳后缀
  文件大小限制 50MB
  200: { path: string, name: string, size: number }
  400: { error: "No file provided" | "Target directory not found" }
  413: { error: "File too large" }

GET /api/fs/download?path=<相对路径>
  流式返回文件原始内容，设置正确 Content-Type 和 Content-Disposition
  路径遍历防护
  200: 文件二进制流
  404: { error: "File not found" }
  403: { error: "Access denied" }

POST /api/fs/mkdir
  Body: { path: string }
  200: { path: string, name: string }
  400: { error: "Directory already exists" }
  403: { error: "Access denied" }

POST /api/fs/rename
  Body: { oldPath: string, newPath: string }
  newPath 如果已存在，返回 400 错误（不覆盖）
  oldPath 和 newPath 都做路径遍历防护
  200: { path: string, name: string }
  400: { error: "Target already exists" | "Source not found" }
  403: { error: "Access denied" }

DELETE /api/fs/file?path=<相对路径>
  仅删除文件或空目录
  非空目录返回 400（前端对非空目录隐藏删除按钮）
  200: { ok: true }
  400: { error: "Directory not empty" }
  404: { error: "File not found" }
  403: { error: "Access denied" }
```

### 前端改动

**文件树面板工具栏** (`KbView.vue`):
- 上传按钮 → 打开上传对话框
- 新建文件夹按钮 → 内联输入框输入目录名
- 刷新按钮 → 重新加载文件树

**上传对话框** (新组件 `src/components/UploadDialog.vue`):
- 拖拽区域 + 文件选择按钮，支持多文件
- 目录选择器（下拉列表，KbView 将文件树数据中的目录节点扁平化后作为 prop 传入 UploadDialog）
- 默认选中当前展开目录或 `inbox/`
- 上传完成后刷新文件树并选中新文件

**文件操作菜单** (`FileTree.vue` 改动):
- 节点 hover 显示 `...` 按钮
- 菜单项：下载、重命名、删除
- 重命名用内联输入框
- 删除前弹出确认对话框（`window.confirm`）
- 非空目录隐藏删除按钮
- 新增 emits: `download(path)`, `rename(oldPath, newPath)`, `delete(path)`, `refresh()`

**Markdown 预览区** (`KbView.vue`):
- 路径旁增加下载按钮
- 非 .md 文件显示文件信息和下载按钮，不渲染 Markdown

### 安全

- 所有文件操作路径必须 resolve 在 KB_ROOT 内
- 上传文件大小限制 50MB
- 仅支持单个知识库实例（NAS 单用户场景）
- rename 的 oldPath 和 newPath 都做路径遍历校验
- rename 目标已存在时拒绝操作（不覆盖）
