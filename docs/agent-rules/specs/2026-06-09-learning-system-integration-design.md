# 个人学习系统 - PARA 课程深度整合设计

> 日期: 2026-06-09 | 状态: Draft | 版本: Phase 1 (MVP) | 范围: Console 前端 + console-api 后端

## 1. 概述

### 1.1 背景

Console 个人数字中心已有 PARA Areas 和 Learning Center 模块：
- **PARA Areas**: 知识领域分类框架
- **Learning Center**: 结构化课程 + SM-2 间隔复习
- **Notion 知识库**: 4 个子库（图书馆、资料搜集、灵感文档、宝藏库）
- **NAS 电子书**: `/volume1/books/` 存储了大量 PDF、MOBI 格式电子书

**问题：** 现有学习流程割裂，缺少统一的阅读体验和知识内化工具。

### 1.2 目标

1. **深度整合**：PARA Areas 与课程系统形成「领域 → 课程 → 学习」闭环
2. **专注阅读**：内置 PDF.js 和 Markdown 阅读器，保证学习注意力连续
3. **本地笔记**：三层笔记系统（边注 + 章节笔记 + 读后感），本地优先存储
4. **知识内化**：阅读进度、高亮标记、主动回忆、间隔复习
5. **智能索引**：NAS 电子书索引与 Notion 图书馆自动关联

### 1.3 范围定义（Phase 1 - MVP）

| 模块 | Phase 1 包含 | Phase 2+ 不包含 |
|------|-------------|----------------|
| 阅读器 | PDF.js、Markdown | EPUB、MOBI、边注系统 |
| 笔记系统 | 章节笔记、读后感 | 边注锚点、回忆卡片 |
| 学习功能 | 进度追踪、高亮标记 | SM-2 间隔复习、知识图谱 |
| 书籍索引 | NAS 文件扫描、搜索 | 全文索引、智能匹配 |
| PARA 集成 | Areas 页面课程 Tab | 跨 Area 知识关联 |

---

## 2. 架构设计

```mermaid
graph TB
    subgraph "前端 Vue 3"
        A1[AreasView.vue] --> A2[课程列表 Tab]
        A2 --> A3[CourseReader 阅读器组件]
        A3 --> A4[PdfViewer - PDF.js]
        A3 --> A5[MarkdownViewer - marked]
        A3 --> A6[NoteEditor - 笔记编辑器]
    end
    
    subgraph "后端 Node.js - Fastify"
        B1[server.mjs - API 入口]
        B1 --> B2[/api/books/* - 书籍索引与读取]
        B1 --> B3[/api/learning/* - 学习笔记与进度]
        B1 --> B4[/api/github/* - 开源课程内容]
    end
    
    subgraph "存储层"
        C1[(SQLite - learning.db)]
        C2[NAS 文件系统 - /volume1/books/]
    end
    
    subgraph "外部依赖"
        D1[Notion API - 图书馆数据]
        D2[GitHub API - 开源课程内容]
    end
    
    A2 --> B2
    A6 --> B3
    B2 --> C2
    B3 --> C1
    B4 --> D2
    A2 --> D1
```

---

## 3. 数据结构设计

### 3.1 SQLite 数据库表结构 (learning.db)

```sql
-- 学习进度表
CREATE TABLE learning_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  area_id TEXT NOT NULL,           -- PARA Area ID
  course_id TEXT NOT NULL,         -- 课程/书籍 ID
  chapter_id TEXT,                 -- 章节 ID
  lesson_id TEXT,                  -- 课时 ID
  progress INTEGER DEFAULT 0,      -- 阅读进度（页码/百分比）
  last_read_at TEXT,               -- 最后阅读时间 (ISO 8601)
  total_time INTEGER DEFAULT 0,    -- 累计阅读时长（秒）
  UNIQUE(area_id, course_id, chapter_id, lesson_id)
);

-- 学习笔记表
CREATE TABLE learning_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  area_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  chapter_id TEXT,
  lesson_id TEXT,
  note_type TEXT NOT NULL,         -- 'chapter' | 'reflection'
  content TEXT NOT NULL,           -- Markdown 内容
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 高亮标记表
CREATE TABLE learning_highlights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  area_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  chapter_id TEXT,
  lesson_id TEXT,
  content TEXT NOT NULL,           -- 高亮的文字内容
  position TEXT,                   -- 位置锚点（PDF 页码 / Markdown 锚点）
  color TEXT DEFAULT '#ffeb3b',    -- 高亮颜色
  note TEXT,                       -- 关联的备注（可选）
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 书籍索引表
CREATE TABLE books_index (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,             -- 书名（从文件名提取）
  file_path TEXT UNIQUE NOT NULL,  -- 文件绝对路径
  file_size INTEGER,               -- 文件大小（字节）
  file_format TEXT NOT NULL,       -- 'pdf' | 'epub' | 'mobi'
  area_id TEXT,                    -- 关联的 PARA Area（智能匹配）
  indexed_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- GitHub 开源课程配置
CREATE TABLE github_courses (
  id TEXT PRIMARY KEY,             -- 课程唯一 ID
  area_id TEXT NOT NULL,           -- 关联的 PARA Area
  title TEXT NOT NULL,
  repo_url TEXT NOT NULL,          -- GitHub 仓库地址
  description TEXT,
  stars INTEGER,
  last_sync TEXT                   -- 最后同步时间
);
```

---

## 4. 后端 API 设计

### 4.1 书籍索引与阅读 API

| 方法 | 路径 | 说明 | 请求/响应示例 |
|------|------|------|--------------|
| `POST` | `/api/books/index` | 触发重新扫描 NAS 书籍目录 | 响应: `{ success: true, count: 1234 }` |
| `GET` | `/api/books/search?q={keyword}` | 搜索书籍（按书名模糊匹配） | 响应: `{ books: [{ id, title, file_format, ... }] }` |
| `GET` | `/api/books/{id}/info` | 获取书籍元信息 | 响应: `{ id, title, file_path, file_size, ... }` |
| `GET` | `/api/books/{id}/view` | 在线阅读（返回文件流） | 响应: 文件流 + Content-Type |
| `GET` | `/api/books/{id}/raw` | 获取原始文件（下载用） | 响应: 文件流 + Content-Disposition |

### 4.2 学习笔记与进度 API

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/learning/progress/{area_id}/{course_id}` | 获取学习进度 |
| `PUT` | `/api/learning/progress` | 更新学习进度 |
| `GET` | `/api/learning/notes/{area_id}/{course_id}` | 获取课程所有笔记 |
| `POST` | `/api/learning/notes` | 新增笔记 |
| `PUT` | `/api/learning/notes/{id}` | 更新笔记 |
| `DELETE` | `/api/learning/notes/{id}` | 删除笔记 |
| `GET` | `/api/learning/highlights/{area_id}/{course_id}` | 获取高亮标记 |
| `POST` | `/api/learning/highlights` | 新增高亮 |
| `DELETE` | `/api/learning/highlights/{id}` | 删除高亮 |

### 4.3 GitHub 开源课程 API

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/github/courses` | 获取配置的开源课程列表 |
| `GET` | `/api/github/courses/{id}/content` | 拉取仓库 README 和目录内容（带缓存） |

---

## 5. 前端组件设计

### 5.1 AreasView.vue 扩展

在现有 PARA Areas 页面新增「课程」Tab：

```vue
<template>
  <div class="areas-view">
    <!-- 现有 Tab -->
    <div class="tabs">
      <button class="tab">概览</button>
      <button class="tab">项目</button>
      <button class="tab active">📚 课程</button>  <!-- 新增 -->
    </div>
    
    <!-- 课程列表区域 -->
    <div class="course-list">
      <!-- Notion 图书馆关联的书籍 -->
      <div class="course-section">
        <h3>我的阅读</h3>
        <!-- 从 Notion 图书馆拉取数据 -->
      </div>
      
      <!-- GitHub 开源课程 -->
      <div class="course-section">
        <h3>开源课程</h3>
        <!-- 从 github_courses 配置拉取 -->
      </div>
      
      <!-- NAS 电子书推荐 -->
      <div class="course-section">
        <h3>NAS 电子书</h3>
        <input type="text" placeholder="搜索电子书..." />
        <!-- 搜索结果 -->
      </div>
    </div>
  </div>
</template>
```

### 5.2 新增组件清单

| 组件 | 路径 | 职责 |
|------|------|------|
| `CourseReader.vue` | `src/components/CourseReader.vue` | 统一阅读器入口组件 |
| `PdfViewer.vue` | `src/components/PdfViewer.vue` | PDF.js 封装组件 |
| `MarkdownViewer.vue` | `src/components/MarkdownViewer.vue` | Markdown 渲染组件 |
| `NoteEditor.vue` | `src/components/NoteEditor.vue` | 笔记编辑器组件 |
| `HighlightManager.vue` | `src/components/HighlightManager.vue` | 高亮管理组件 |

### 5.3 Composables

| 文件 | 路径 | 职责 |
|------|------|------|
| `useLearning.ts` | `src/composables/useLearning.ts` | 学习笔记与进度 API |
| `useBooks.ts` | `src/composables/useBooks.ts` | 书籍索引与搜索 API |

---

## 6. 文件变更清单

### 前端变更

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/views/AreasView.vue` | 修改 | 新增课程 Tab，集成课程列表 |
| `src/components/CourseReader.vue` | 新增 | 阅读器主组件 |
| `src/components/PdfViewer.vue` | 新增 | PDF.js 阅读器封装 |
| `src/components/MarkdownViewer.vue` | 新增 | Markdown 阅读器封装 |
| `src/components/NoteEditor.vue` | 新增 | 笔记编辑器（三层笔记） |
| `src/composables/useLearning.ts` | 新增 | 学习相关 API composable |
| `src/composables/useBooks.ts` | 新增 | 书籍索引相关 composable |
| `package.json` | 修改 | 新增依赖：`pdfjs-dist`, `marked` |

### 后端变更

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `console-api/server.mjs` | 修改 | 新增 API 路由注册 |
| `console-api/services/books.mjs` | 新增 | 书籍索引与读取服务 |
| `console-api/services/learning.mjs` | 新增 | 学习笔记与进度服务 |
| `console-api/services/github.mjs` | 新增 | GitHub 开源课程服务 |
| `console-api/db/learning.db` | 新增 | SQLite 数据库文件 |

---

## 7. 测试用例设计

### 7.1 单元测试

```javascript
// books.mjs 单元测试
describe('Books Service', () => {
  it('should scan /volume1/books/ and index PDF files')
  it('should search books by title keyword with fuzzy match')
  it('should handle non-PDF formats gracefully (skip or warn)')
  it('should return file stream for viewing and download')
})

// learning.mjs 单元测试
describe('Learning Service', () => {
  it('should create and retrieve chapter notes')
  it('should create and retrieve reflection notes')
  it('should track and update reading progress')
  it('should add, list, and remove text highlights')
  it('should handle concurrent note updates gracefully')
})
```

### 7.2 E2E 测试

```javascript
describe('Course Reader End-to-End Flow', () => {
  it('should navigate to Areas page and see Courses tab')
  it('should search NAS books and open PDF in viewer')
  it('should display book content correctly in PDF viewer')
  it('should create chapter notes and verify persistence')
  it('should highlight text and retain after page refresh')
  it('should remember reading position when reopening book')
  it('should update reading progress as user scrolls/pages')
})
```

---

## 8. DFX 评估

| 维度 | 等级 | 评估说明 |
|------|------|---------|
| **可调试性** | ✅ 高 | 前后端独立日志，SQLite 可直接查询，API 响应带 trace_id |
| **可测试性** | ✅ 高 | 服务层独立封装，单元测试覆盖方便，接口契约清晰 |
| **可靠性** | ✅ 高 | SQLite 事务保证数据一致性，文件读取错误有兜底机制 |
| **可操作性** | ✅ 高 | 单文件数据库，备份简单，无额外中间件依赖 |
| **可扩展性** | ✅ 高 | 模块化设计，Phase 2/3 功能可无缝叠加，接口向后兼容 |
| **可重用性** | ⚪ 中 | 阅读器组件可在其他场景复用，但业务逻辑有一定耦合度 |

---

## 9. 验收标准（Phase 1）

### 功能验收

1. ✅ **Areas 课程 Tab**：PARA Areas 页面显示「课程」Tab，包含三个区域（我的阅读 / 开源课程 / NAS 电子书）
2. ✅ **书籍索引**：NAS 书籍索引功能可用，可按书名关键字搜索
3. ✅ **PDF 阅读器**：点击 PDF 书籍可打开内置阅读器，翻页、缩放功能正常
4. ✅ **Markdown 阅读器**：开源课程 README 内容可正常渲染阅读
5. ✅ **笔记系统**：章节笔记和读后感可编辑、保存、回显，支持 Markdown 格式
6. ✅ **文本高亮**：文字高亮功能可用，页面刷新后高亮状态保留
7. ✅ **进度追踪**：阅读进度自动记录，再次打开书籍回到上次阅读位置
8. ✅ **构建通过**：`npm run build` 前端构建无错误
9. ✅ **后端测试**：后端单元测试全部通过（覆盖率 ≥ 80%）
10. ✅ **运行时质量**：生产环境无控制台 JavaScript 错误，API 成功率 ≥ 99.5%

### 性能验收

- 书籍搜索响应时间 < 200ms
- PDF 首屏加载时间 < 3s
- 笔记保存响应时间 < 500ms

---

## 10. 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| PDF.js 内存泄漏 | 中 | 高 | 组件销毁时清理资源，限制同时打开的文档数 |
| NAS 大文件扫描超时 | 中 | 中 | 增量索引，后台任务处理，首次扫描显示进度 |
| SQLite 并发写入锁 | 低 | 中 | WAL 模式开启，重试机制，批量写入优化 |

---

**文档完稿日期：2026-06-09**
