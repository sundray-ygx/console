# 个人学习系统 Phase 1 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Console 中实现 PARA Areas 与课程系统的深度整合，包含 PDF/Markdown 阅读器、本地笔记系统、学习进度追踪。

**Architecture:** 后端新增 3 个服务模块（books/learning/github）+ SQLite 存储；前端扩展 AreasView + 新增 5 个组件。

**Tech Stack:** Vue 3.5 + TypeScript + Fastify + SQLite + pdfjs-dist + marked

**Conventions (learned from codebase):**
- **前端**: Vue 3 Composition API + `<script setup lang="ts">`, Composable 模式 (`useXXX.ts`), 类型定义在 composable 开头
- **后端**: Node.js ES Modules (`.mjs`), Fastify 框架, `fs/promises` 异步文件操作, 简单内存缓存
- **命名**: camelCase 变量/函数, PascalCase 组件/类型, kebab-case 文件名
- **错误处理**: `try/catch` 包裹 API 调用, 返回 `{ error: message }`
- **API 基础路径**: `API_BASE` 从 `../config/services` 导入

**Domain Skills (from session context):**
- 单测编写: `test-code-generator` — generate unit test code
- 测试方法: `test-driven-development` — TDD red-green cycle
- 排障调试: `systematic-debugging` — evidence-first fault investigation
- 代码编写: `code-compliance-check` — coding standards check

---

## 任务总览

| 任务 | 模块 | 预估时间 | 依赖 |
|------|------|---------|------|
| Task 1 | 后端 - SQLite 数据库初始化与基础服务 | 30 min | - |
| Task 2 | 后端 - 书籍索引与读取服务 | 45 min | Task 1 |
| Task 3 | 后端 - 学习笔记与进度服务 | 45 min | Task 1 |
| Task 4 | 后端 - API 路由注册 | 30 min | Task 2,3 |
| Task 5 | 前端 - useBooks composable | 20 min | Task 4 |
| Task 6 | 前端 - useLearning composable | 20 min | Task 4 |
| Task 7 | 前端 - PDF.js 阅读器组件 | 45 min | Task 5,6 |
| Task 8 | 前端 - Markdown 阅读器组件 | 30 min | Task 7 |
| Task 9 | 前端 - 笔记编辑器组件 | 45 min | Task 8 |
| Task 10 | 前端 - CourseReader 主组件 | 30 min | Task 9 |
| Task 11 | 前端 - AreasView 课程 Tab 集成 | 30 min | Task 10 |
| Task 12 | 构建与端到端测试 | 30 min | All |

---

## Task 1: 后端 - SQLite 数据库初始化

**Files:**
- Create: `console-api/services/db.mjs`
- Create: `console-api/tests/db.test.mjs`

**Test Cases:**

| ID | Source | Type | Preconditions/Input | Expected Assertions | Automation | Test Target | Command |
|---|---|---|---|---|---|---|---|
| TC-DB-001 | §3.1 | normal | 首次运行 | 数据库文件创建成功，所有表结构正确 | unit | `console-api/tests/db.test.mjs::test_init_db` | `node --test console-api/tests/db.test.mjs` |
| TC-DB-002 | §3.1 | normal | 数据库已存在 | 不重复创建表，数据保留 | unit | `console-api/tests/db.test.mjs::test_no_duplicate_tables` | `node --test console-api/tests/db.test.mjs` |

- [ ] **Step 1: 编写数据库初始化测试**

```javascript
// console-api/tests/db.test.mjs
import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import { unlink, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_DB = join(__dirname, '../db/test-learning.db');

describe('Database Initialization', () => {
  beforeEach(async () => {
    if (existsSync(TEST_DB)) {
      await unlink(TEST_DB);
    }
  });

  it('should create database file and all tables', async () => {
    const { initDb, db } = await import('../services/db.mjs');
    await initDb(TEST_DB);
    assert.ok(existsSync(TEST_DB), 'Database file should exist');
    
    // Verify tables exist
    const tables = await db.all(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    const tableNames = tables.map(t => t.name);
    assert.ok(tableNames.includes('learning_progress'), 'learning_progress table should exist');
    assert.ok(tableNames.includes('learning_notes'), 'learning_notes table should exist');
    assert.ok(tableNames.includes('learning_highlights'), 'learning_highlights table should exist');
    assert.ok(tableNames.includes('books_index'), 'books_index table should exist');
    assert.ok(tableNames.includes('github_courses'), 'github_courses table should exist');
    await db.close();
  });
});
```

- [ ] **Step 2: 运行测试，验证失败（RED 阶段）**

Run: `node --test console-api/tests/db.test.mjs`
Expected: FAIL with "Cannot find module '../services/db.mjs'"

> **调用 `test-driven-development`** 执行 RED 阶段

- [ ] **Step 3: 实现数据库初始化服务**

```javascript
// console-api/services/db.mjs
import { existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.LEARNING_DB_PATH || join(__dirname, '../db/learning.db');

let dbInstance = null;

// 确保 db 目录存在
const dbDir = dirname(DB_PATH);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

export async function initDb(dbPath = DB_PATH) {
  if (dbInstance) return dbInstance;

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Enable WAL mode for better concurrency
  await db.exec('PRAGMA journal_mode = WAL;');
  await db.exec('PRAGMA foreign_keys = ON;');

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS learning_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      area_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      chapter_id TEXT,
      lesson_id TEXT,
      progress INTEGER DEFAULT 0,
      last_read_at TEXT,
      total_time INTEGER DEFAULT 0,
      UNIQUE(area_id, course_id, chapter_id, lesson_id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS learning_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      area_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      chapter_id TEXT,
      lesson_id TEXT,
      note_type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS learning_highlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      area_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      chapter_id TEXT,
      lesson_id TEXT,
      content TEXT NOT NULL,
      position TEXT,
      color TEXT DEFAULT '#ffeb3b',
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS books_index (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      file_path TEXT UNIQUE NOT NULL,
      file_size INTEGER,
      file_format TEXT NOT NULL,
      area_id TEXT,
      indexed_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS github_courses (
      id TEXT PRIMARY KEY,
      area_id TEXT NOT NULL,
      title TEXT NOT NULL,
      repo_url TEXT NOT NULL,
      description TEXT,
      stars INTEGER,
      last_sync TEXT
    )
  `);

  dbInstance = db;
  return db;
}

export async function getDb() {
  if (!dbInstance) {
    return await initDb();
  }
  return dbInstance;
}

export { sqlite3 };
```

- [ ] **Step 4: 运行测试，验证通过（GREEN 阶段）**

Run: `node --test console-api/tests/db.test.mjs`
Expected: PASS

> **调用 `code-compliance-check`** 检查代码规范

- [ ] **Step 5: 安装 sqlite3 依赖**

Run: `cd console-api && npm install sqlite3 --save`
Expected: Installation successful

- [ ] **Step 6: Commit**

```bash
git add console-api/services/db.mjs console-api/tests/db.test.mjs console-api/package.json
git commit -m "feat: add SQLite database initialization service"
```

---

## Task 2: 后端 - 书籍索引与读取服务

**Files:**
- Create: `console-api/services/books.mjs`
- Create: `console-api/tests/books.test.mjs`

**Test Cases:**

| ID | Source | Type | Preconditions/Input | Expected Assertions | Automation | Test Target | Command |
|---|---|---|---|---|---|---|---|
| TC-BOOKS-001 | §4.1 | normal | NAS 有 PDF 文件 | 索引扫描成功，PDF 文件被正确识别 | unit | `console-api/tests/books.test.mjs::test_index_books` | `node --test console-api/tests/books.test.mjs` |
| TC-BOOKS-002 | §4.1 | normal | 搜索关键词 | 返回匹配的书籍列表 | unit | `console-api/tests/books.test.mjs::test_search_books` | `node --test console-api/tests/books.test.mjs` |
| TC-BOOKS-003 | §4.1 | normal | 书籍 ID | 返回正确的文件流 | unit | `console-api/tests/books.test.mjs::test_get_book_stream` | `node --test console-api/tests/books.test.mjs` |

- [ ] **Step 1: 编写书籍服务测试**

```javascript
// console-api/tests/books.test.mjs
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { unlink, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_DB = join(__dirname, '../db/test-books.db');
const TEST_BOOKS_DIR = join(__dirname, '../test-books');

describe('Books Service', () => {
  beforeEach(async () => {
    // Clean up
    if (existsSync(TEST_DB)) await unlink(TEST_DB);
    // Create test books directory
    if (!existsSync(TEST_BOOKS_DIR)) mkdirSync(TEST_BOOKS_DIR, { recursive: true });
    // Create a dummy PDF file
    writeFileSync(join(TEST_BOOKS_DIR, 'test-book.pdf'), '%PDF-1.4 dummy content');
    writeFileSync(join(TEST_BOOKS_DIR, 'another-book.pdf'), '%PDF-1.4 another book');
    // Re-initialize DB
    const { initDb } = await import('../services/db.mjs');
    await initDb(TEST_DB);
  });

  it('should index PDF files from directory', async () => {
    const { indexBooks } = await import('../services/books.mjs');
    const result = await indexBooks(TEST_BOOKS_DIR);
    assert.ok(result.success, 'Index should succeed');
    assert.equal(result.count, 2, 'Should find 2 PDF files');
  });

  it('should search books by title keyword', async () => {
    const { indexBooks, searchBooks } = await import('../services/books.mjs');
    await indexBooks(TEST_BOOKS_DIR);
    
    const results = await searchBooks('test');
    assert.ok(Array.isArray(results), 'Should return array');
    assert.ok(results.length >= 1, 'Should find at least one book');
    assert.ok(results[0].title.toLowerCase().includes('test'), 'Title should match keyword');
  });
});
```

- [ ] **Step 2: 运行测试，验证失败（RED 阶段）**

Run: `node --test console-api/tests/books.test.mjs`
Expected: FAIL with "Cannot find module '../services/books.mjs'"

> **调用 `test-driven-development`** 执行 RED 阶段

- [ ] **Step 3: 实现书籍索引服务**

```javascript
// console-api/services/books.mjs
import { readdir, stat } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import { extname, basename, join } from 'node:path';
import { getDb } from './db.mjs';

const BOOKS_ROOT = process.env.BOOKS_ROOT || '/volume1/books';
const SUPPORTED_FORMATS = ['.pdf', '.epub', '.mobi'];

// Index all books from the root directory
export async function indexBooks(rootDir = BOOKS_ROOT) {
  const db = await getDb();
  let count = 0;

  async function scanDirectory(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (SUPPORTED_FORMATS.includes(ext)) {
          const fileStat = await stat(fullPath);
          const title = basename(entry.name, ext);
          const format = ext.slice(1); // remove leading dot
          
          try {
            await db.run(`
              INSERT OR IGNORE INTO books_index (title, file_path, file_size, file_format)
              VALUES (?, ?, ?, ?)
            `, [title, fullPath, fileStat.size, format]);
            count++;
          } catch (e) {
            console.warn(`Failed to index ${fullPath}:`, e.message);
          }
        }
      }
    }
  }

  await scanDirectory(rootDir);
  return { success: true, count };
}

// Search books by title keyword
export async function searchBooks(keyword, limit = 20) {
  const db = await getDb();
  const results = await db.all(`
    SELECT * FROM books_index 
    WHERE title LIKE ? 
    ORDER BY indexed_at DESC 
    LIMIT ?
  `, [`%${keyword}%`, limit]);
  return results;
}

// Get book info by ID
export async function getBookInfo(id) {
  const db = await getDb();
  const book = await db.get('SELECT * FROM books_index WHERE id = ?', [id]);
  return book || null;
}

// Get book file stream
export async function getBookStream(id) {
  const book = await getBookInfo(id);
  if (!book) throw new Error('Book not found');
  if (!existsSync(book.file_path)) throw new Error('Book file not found');
  return {
    stream: createReadStream(book.file_path),
    format: book.file_format,
    title: book.title,
  };
}

// List recently indexed books
export async function getRecentBooks(limit = 10) {
  const db = await getDb();
  return await db.all(`
    SELECT * FROM books_index 
    ORDER BY indexed_at DESC 
    LIMIT ?
  `, [limit]);
}
```

- [ ] **Step 4: 运行测试，验证通过（GREEN 阶段）**

Run: `node --test console-api/tests/books.test.mjs`
Expected: PASS

> **调用 `code-compliance-check`** 检查代码规范

- [ ] **Step 5: Commit**

```bash
git add console-api/services/books.mjs console-api/tests/books.test.mjs
git commit -m "feat: add books indexing and reading service"
```

---

## Task 3: 后端 - 学习笔记与进度服务

**Files:**
- Create: `console-api/services/learning.mjs`
- Create: `console-api/tests/learning.test.mjs`

**Test Cases:**

| ID | Source | Type | Preconditions/Input | Expected Assertions | Automation | Test Target | Command |
|---|---|---|---|---|---|---|---|
| TC-LEARN-001 | §4.2 | normal | 课程 ID + 页码 | 进度被正确保存 | unit | `console-api/tests/learning.test.mjs::test_save_progress` | `node --test console-api/tests/learning.test.mjs` |
| TC-LEARN-002 | §4.2 | normal | 已保存进度 | 获取进度返回正确值 | unit | `console-api/tests/learning.test.mjs::test_get_progress` | `node --test console-api/tests/learning.test.mjs` |
| TC-LEARN-003 | §4.2 | normal | 笔记内容 | 笔记被正确创建和检索 | unit | `console-api/tests/learning.test.mjs::test_notes_crud` | `node --test console-api/tests/learning.test.mjs` |
| TC-LEARN-004 | §4.2 | normal | 高亮文本内容 | 高亮被正确保存 | unit | `console-api/tests/learning.test.mjs::test_highlights` | `node --test console-api/tests/learning.test.mjs` |

- [ ] **Step 1: 编写学习服务测试**

```javascript
// console-api/tests/learning.test.mjs
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { unlink, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_DB = join(__dirname, '../db/test-learning.db');

describe('Learning Service', () => {
  beforeEach(async () => {
    if (existsSync(TEST_DB)) await unlink(TEST_DB);
    const { initDb } = await import('../services/db.mjs');
    await initDb(TEST_DB);
  });

  it('should save and retrieve reading progress', async () => {
    const { saveProgress, getProgress } = await import('../services/learning.mjs');
    
    await saveProgress({
      area_id: 'test-area',
      course_id: 'test-book',
      progress: 42,
    });

    const progress = await getProgress('test-area', 'test-book');
    assert.ok(progress, 'Progress should exist');
    assert.equal(progress.progress, 42, 'Progress value should match');
  });

  it('should create and retrieve notes', async () => {
    const { createNote, getNotes } = await import('../services/learning.mjs');
    
    const noteId = await createNote({
      area_id: 'test-area',
      course_id: 'test-book',
      note_type: 'chapter',
      content: '# Test Note\n\nThis is a test note.',
    });

    const notes = await getNotes('test-area', 'test-book');
    assert.ok(Array.isArray(notes), 'Should return array');
    assert.equal(notes.length, 1, 'Should have one note');
    assert.equal(notes[0].content, '# Test Note\n\nThis is a test note.');
  });

  it('should add and retrieve highlights', async () => {
    const { addHighlight, getHighlights } = await import('../services/learning.mjs');
    
    await addHighlight({
      area_id: 'test-area',
      course_id: 'test-book',
      content: 'Highlighted text',
      position: 'page-42',
      color: '#ffeb3b',
    });

    const highlights = await getHighlights('test-area', 'test-book');
    assert.ok(Array.isArray(highlights), 'Should return array');
    assert.equal(highlights.length, 1, 'Should have one highlight');
    assert.equal(highlights[0].content, 'Highlighted text');
  });
});
```

- [ ] **Step 2: 运行测试，验证失败（RED 阶段）**

Run: `node --test console-api/tests/learning.test.mjs`
Expected: FAIL with "Cannot find module '../services/learning.mjs'"

> **调用 `test-driven-development`** 执行 RED 阶段

- [ ] **Step 3: 实现学习服务**

```javascript
// console-api/services/learning.mjs
import { getDb } from './db.mjs';

// Progress management
export async function saveProgress({ area_id, course_id, chapter_id, lesson_id, progress, total_time }) {
  const db = await getDb();
  const now = new Date().toISOString();
  
  const result = await db.run(`
    INSERT INTO learning_progress (area_id, course_id, chapter_id, lesson_id, progress, last_read_at, total_time)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(area_id, course_id, chapter_id, lesson_id) 
    DO UPDATE SET progress = ?, last_read_at = ?, total_time = total_time + ?
  `, [
    area_id, course_id, chapter_id || null, lesson_id || null, progress, now, total_time || 0,
    progress, now, total_time || 0
  ]);
  
  return { success: true, id: result.lastID };
}

export async function getProgress(area_id, course_id, chapter_id = null, lesson_id = null) {
  const db = await getDb();
  const params = [area_id, course_id];
  let whereClause = 'area_id = ? AND course_id = ?';
  
  if (chapter_id) {
    whereClause += ' AND chapter_id = ?';
    params.push(chapter_id);
  }
  if (lesson_id) {
    whereClause += ' AND lesson_id = ?';
    params.push(lesson_id);
  }
  
  return await db.get(`SELECT * FROM learning_progress WHERE ${whereClause}`, params);
}

// Notes management
export async function createNote({ area_id, course_id, chapter_id, lesson_id, note_type, content }) {
  const db = await getDb();
  const now = new Date().toISOString();
  
  const result = await db.run(`
    INSERT INTO learning_notes (area_id, course_id, chapter_id, lesson_id, note_type, content, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [area_id, course_id, chapter_id || null, lesson_id || null, note_type, content, now, now]);
  
  return result.lastID;
}

export async function updateNote(id, content) {
  const db = await getDb();
  const now = new Date().toISOString();
  
  await db.run(`
    UPDATE learning_notes SET content = ?, updated_at = ? WHERE id = ?
  `, [content, now, id]);
  
  return { success: true };
}

export async function deleteNote(id) {
  const db = await getDb();
  await db.run('DELETE FROM learning_notes WHERE id = ?', [id]);
  return { success: true };
}

export async function getNotes(area_id, course_id, chapter_id = null, lesson_id = null) {
  const db = await getDb();
  const params = [area_id, course_id];
  let whereClause = 'area_id = ? AND course_id = ?';
  
  if (chapter_id) {
    whereClause += ' AND chapter_id = ?';
    params.push(chapter_id);
  }
  if (lesson_id) {
    whereClause += ' AND lesson_id = ?';
    params.push(lesson_id);
  }
  
  return await db.all(`SELECT * FROM learning_notes WHERE ${whereClause} ORDER BY updated_at DESC`, params);
}

// Highlights management
export async function addHighlight({ area_id, course_id, chapter_id, lesson_id, content, position, color, note }) {
  const db = await getDb();
  const now = new Date().toISOString();
  
  const result = await db.run(`
    INSERT INTO learning_highlights (area_id, course_id, chapter_id, lesson_id, content, position, color, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [area_id, course_id, chapter_id || null, lesson_id || null, content, position || null, color || '#ffeb3b', note || null, now]);
  
  return result.lastID;
}

export async function deleteHighlight(id) {
  const db = await getDb();
  await db.run('DELETE FROM learning_highlights WHERE id = ?', [id]);
  return { success: true };
}

export async function getHighlights(area_id, course_id, chapter_id = null, lesson_id = null) {
  const db = await getDb();
  const params = [area_id, course_id];
  let whereClause = 'area_id = ? AND course_id = ?';
  
  if (chapter_id) {
    whereClause += ' AND chapter_id = ?';
    params.push(chapter_id);
  }
  if (lesson_id) {
    whereClause += ' AND lesson_id = ?';
    params.push(lesson_id);
  }
  
  return await db.all(`SELECT * FROM learning_highlights WHERE ${whereClause} ORDER BY created_at DESC`, params);
}
```

- [ ] **Step 4: 运行测试，验证通过（GREEN 阶段）**

Run: `node --test console-api/tests/learning.test.mjs`
Expected: PASS

> **调用 `code-compliance-check`** 检查代码规范

- [ ] **Step 5: Commit**

```bash
git add console-api/services/learning.mjs console-api/tests/learning.test.mjs
git commit -m "feat: add learning notes and progress service"
```

---

## Task 4: 后端 - API 路由注册

**Files:**
- Modify: `console-api/server.mjs` (约在第 75 行后插入)

**Test Cases:**

| ID | Source | Type | Preconditions/Input | Expected Assertions | Automation | Test Target | Command |
|---|---|---|---|---|---|---|---|
| TC-API-001 | §4.1 | normal | POST /api/books/index | 返回成功状态 | integration | `curl -X POST http://localhost:3300/api/books/index` | curl |
| TC-API-002 | §4.1 | normal | GET /api/books/search?q=test | 返回 JSON 列表 | integration | `curl http://localhost:3300/api/books/search?q=test` | curl |
| TC-API-003 | §4.2 | normal | GET /api/learning/progress/test-area/test-course | 返回进度数据 | integration | `curl http://localhost:3300/api/learning/progress/test-area/test-course` | curl |

- [ ] **Step 1: 在 server.mjs 中导入服务模块**

```javascript
// 在文件顶部 import 区域添加（约第 6 行后）:
import * as books from './services/books.mjs';
import * as learning from './services/learning.mjs';
import { initDb } from './services/db.mjs';
```

- [ ] **Step 2: 在 server.mjs 中初始化数据库**

```javascript
// 在服务启动前添加初始化（约第 15 行后）:
// Initialize database
await initDb();
```

- [ ] **Step 3: 添加 Books API 路由**

```javascript
// 在 "// ── Routes ──" 注释后添加:

// Books API
app.post('/api/books/index', async (req, reply) => {
  try {
    const result = await books.indexBooks();
    return result;
  } catch (e) {
    reply.code(500).send({ error: e.message });
  }
});

app.get('/api/books/search', async (req, reply) => {
  try {
    const keyword = req.query.q || '';
    const limit = parseInt(req.query.limit) || 20;
    const results = await books.searchBooks(keyword, limit);
    return { books: results };
  } catch (e) {
    reply.code(500).send({ error: e.message });
  }
});

app.get('/api/books/:id/info', async (req, reply) => {
  try {
    const book = await books.getBookInfo(req.params.id);
    if (!book) {
      reply.code(404).send({ error: 'Book not found' });
      return;
    }
    return book;
  } catch (e) {
    reply.code(500).send({ error: e.message });
  }
});

app.get('/api/books/:id/view', async (req, reply) => {
  try {
    const { stream, format, title } = await books.getBookStream(req.params.id);
    const contentType = format === 'pdf' ? 'application/pdf' : 'application/octet-stream';
    reply.header('Content-Type', contentType);
    reply.header('Content-Disposition', `inline; filename="${encodeURIComponent(title)}.${format}"`);
    return stream;
  } catch (e) {
    reply.code(e.message === 'Book not found' || e.message === 'Book file not found' ? 404 : 500).send({ error: e.message });
  }
});

app.get('/api/books/recent', async (req, reply) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const books = await books.getRecentBooks(limit);
    return { books };
  } catch (e) {
    reply.code(500).send({ error: e.message });
  }
});
```

- [ ] **Step 4: 添加 Learning API 路由**

```javascript
// 在 Books API 后继续添加:

// Learning API - Progress
app.get('/api/learning/progress/:area_id/:course_id', async (req, reply) => {
  try {
    const { area_id, course_id } = req.params;
    const { chapter_id, lesson_id } = req.query;
    const progress = await learning.getProgress(area_id, course_id, chapter_id, lesson_id);
    return progress || { progress: 0 };
  } catch (e) {
    reply.code(500).send({ error: e.message });
  }
});

app.put('/api/learning/progress', async (req, reply) => {
  try {
    const result = await learning.saveProgress(req.body);
    return result;
  } catch (e) {
    reply.code(500).send({ error: e.message });
  }
});

// Learning API - Notes
app.get('/api/learning/notes/:area_id/:course_id', async (req, reply) => {
  try {
    const { area_id, course_id } = req.params;
    const { chapter_id, lesson_id } = req.query;
    const notes = await learning.getNotes(area_id, course_id, chapter_id, lesson_id);
    return { notes };
  } catch (e) {
    reply.code(500).send({ error: e.message });
  }
});

app.post('/api/learning/notes', async (req, reply) => {
  try {
    const id = await learning.createNote(req.body);
    return { success: true, id };
  } catch (e) {
    reply.code(500).send({ error: e.message });
  }
});

app.put('/api/learning/notes/:id', async (req, reply) => {
  try {
    await learning.updateNote(req.params.id, req.body.content);
    return { success: true };
  } catch (e) {
    reply.code(500).send({ error: e.message });
  }
});

app.delete('/api/learning/notes/:id', async (req, reply) => {
  try {
    await learning.deleteNote(req.params.id);
    return { success: true };
  } catch (e) {
    reply.code(500).send({ error: e.message });
  }
});

// Learning API - Highlights
app.get('/api/learning/highlights/:area_id/:course_id', async (req, reply) => {
  try {
    const { area_id, course_id } = req.params;
    const { chapter_id, lesson_id } = req.query;
    const highlights = await learning.getHighlights(area_id, course_id, chapter_id, lesson_id);
    return { highlights };
  } catch (e) {
    reply.code(500).send({ error: e.message });
  }
});

app.post('/api/learning/highlights', async (req, reply) => {
  try {
    const id = await learning.addHighlight(req.body);
    return { success: true, id };
  } catch (e) {
    reply.code(500).send({ error: e.message });
  }
});

app.delete('/api/learning/highlights/:id', async (req, reply) => {
  try {
    await learning.deleteHighlight(req.params.id);
    return { success: true };
  } catch (e) {
    reply.code(500).send({ error: e.message });
  }
});
```

- [ ] **Step 5: 验证 API 路由**

Run (in separate terminal): `cd console-api && node server.mjs`
Run: `curl -s http://localhost:3300/api/books/recent | head -20`
Expected: Valid JSON response `{"books": [...]}`

- [ ] **Step 6: Commit**

```bash
git add console-api/server.mjs
git commit -m "feat: add books and learning API routes"
```

---

## Task 5: 前端 - useBooks composable

**Files:**
- Create: `src/composables/useBooks.ts`

- [ ] **Step 1: 实现 useBooks composable**

```typescript
// src/composables/useBooks.ts
import { ref } from 'vue';
import { API_BASE } from '../config/services';

/* ── Types ── */

export interface Book {
  id: number;
  title: string;
  file_path: string;
  file_size: number;
  file_format: 'pdf' | 'epub' | 'mobi';
  area_id?: string;
  indexed_at: string;
}

/* ── State ── */

const loading = ref(false);
const error = ref<string | null>(null);

/* ── Composable ── */

export function useBooks() {
  async function indexBooks() {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API_BASE}/api/books/index`, { method: 'POST' });
      if (!res.ok) throw new Error('Index failed');
      return await res.json();
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function searchBooks(keyword: string, limit = 20): Promise<Book[]> {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API_BASE}/api/books/search?q=${encodeURIComponent(keyword)}&limit=${limit}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      return data.books || [];
    } catch (e: any) {
      error.value = e.message;
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function getRecentBooks(limit = 10): Promise<Book[]> {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API_BASE}/api/books/recent?limit=${limit}`);
      if (!res.ok) throw new Error('Failed to get recent books');
      const data = await res.json();
      return data.books || [];
    } catch (e: any) {
      error.value = e.message;
      return [];
    } finally {
      loading.value = false;
    }
  }

  function getBookViewUrl(id: number): string {
    return `${API_BASE}/api/books/${id}/view`;
  }

  return {
    loading,
    error,
    indexBooks,
    searchBooks,
    getRecentBooks,
    getBookViewUrl,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/composables/useBooks.ts
git commit -m "feat: add useBooks composable for book search and viewing"
```

---

## Task 6: 前端 - useLearning composable

**Files:**
- Create: `src/composables/useLearning.ts`

- [ ] **Step 1: 实现 useLearning composable**

```typescript
// src/composables/useLearning.ts
import { ref } from 'vue';
import { API_BASE } from '../config/services';

/* ── Types ── */

export interface Progress {
  id?: number;
  area_id: string;
  course_id: string;
  progress: number;
}

export interface Note {
  id: number;
  note_type: 'chapter' | 'reflection';
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Highlight {
  id?: number;
  content: string;
  position?: string;
  color?: string;
  note?: string;
}

/* ── State ── */

const loading = ref(false);
const error = ref<string | null>(null);

/* ── Composable ── */

export function useLearning() {
  async function fetchProgress(courseId: string): Promise<number> {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API_BASE}/api/learning/progress/${courseId}/current`);
      if (!res.ok) {
        if (res.status === 404) return 0;
        throw new Error('Failed to fetch progress');
      }
      const data = await res.json();
      return data.progress || 0;
    } catch (e: any) {
      error.value = e.message;
      return 0;
    } finally {
      loading.value = false;
    }
  }

  async function saveProgress(courseId: string, progress: number): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API_BASE}/api/learning/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress }),
      });
      return res.ok;
    } catch (e: any) {
      error.value = e.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function fetchNotes(courseId: string): Promise<Note[]> {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API_BASE}/api/learning/notes/${courseId}`);
      if (!res.ok) throw new Error('Failed to fetch notes');
      const data = await res.json();
      return data.notes || [];
    } catch (e: any) {
      error.value = e.message;
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function createNote(note: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<number | null> {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API_BASE}/api/learning/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      });
      if (!res.ok) throw new Error('Failed to create note');
      const data = await res.json();
      return data.id;
    } catch (e: any) {
      error.value = e.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function updateNote(id: number, content: string): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API_BASE}/api/learning/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      return res.ok;
    } catch (e: any) {
      error.value = e.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteNote(id: number): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API_BASE}/api/learning/notes/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch (e: any) {
      error.value = e.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function fetchHighlights(courseId: string): Promise<Highlight[]> {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API_BASE}/api/learning/highlights/${courseId}`);
      if (!res.ok) throw new Error('Failed to fetch highlights');
      const data = await res.json();
      return data.highlights || [];
    } catch (e: any) {
      error.value = e.message;
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function addHighlight(highlight: Highlight): Promise<number | null> {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API_BASE}/api/learning/highlights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(highlight),
      });
      if (!res.ok) throw new Error('Failed to add highlight');
      const data = await res.json();
      return data.id;
    } catch (e: any) {
      error.value = e.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function deleteHighlight(id: number): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API_BASE}/api/learning/highlights/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch (e: any) {
      error.value = e.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    error,
    fetchProgress,
    saveProgress,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    fetchHighlights,
    addHighlight,
    deleteHighlight,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/composables/useLearning.ts
git commit -m "feat: add useLearning composable for notes and progress"
```

---

## Task 7: 前端 - PDF.js 阅读器组件

**Files:**
- Create: `src/components/PdfViewer.vue`
- Modify: `package.json` (add pdfjs-dist dependency)

- [ ] **Step 1: 安装 PDF.js 依赖**

Run: `npm install pdfjs-dist@^3.11.174 --save`
Expected: Installation successful

- [ ] **Step 2: 实现 PdfViewer 组件**

```vue
<!-- src/components/PdfViewer.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const props = defineProps<{
  src: string;
  initialPage?: number;
}>();

const emit = defineEmits<{
  (e: 'page-change', page: number): void;
  (e: 'progress-change', progress: number): void;
  (e: 'highlight', selection: { text: string; position: string }): void;
}>();

/* ── State ── */
const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const currentPage = ref(props.initialPage || 1);
const totalPages = ref(0);
const pdfDoc = ref<pdfjsLib.PDFDocumentProxy | null>(null);
const scale = ref(1.5);
const zoomLevels = [0.75, 1, 1.25, 1.5, 2, 2.5, 3];

/* ── Computed ── */
const progressPercent = computed(() => {
  if (totalPages.value === 0) return 0;
  return Math.round((currentPage.value / totalPages.value) * 100);
});

const canZoomIn = computed(() => scale.value < zoomLevels[zoomLevels.length - 1]);
const canZoomOut = computed(() => scale.value > zoomLevels[0]);

/* ── Methods ── */
async function loadPdf() {
  loading.value = true;
  error.value = null;
  try {
    const loadingTask = pdfjsLib.getDocument(props.src);
    pdfDoc.value = await loadingTask.promise;
    totalPages.value = pdfDoc.value.numPages;
    renderPage(currentPage.value);
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function renderPage(pageNum: number) {
  if (!pdfDoc.value || !canvasRef.value) return;
  
  const page = await pdfDoc.value.getPage(pageNum);
  const viewport = page.getViewport({ scale: scale.value });
  
  const canvas = canvasRef.value;
  const context = canvas.getContext('2d');
  if (!context) return;
  
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };
  
  await page.render(renderContext).promise;
  currentPage.value = pageNum;
  emit('page-change', pageNum);
  emit('progress-change', progressPercent.value);
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    renderPage(page);
  }
}

function nextPage() {
  goToPage(currentPage.value + 1);
}

function prevPage() {
  goToPage(currentPage.value - 1);
}

function zoomIn() {
  const idx = zoomLevels.indexOf(scale.value);
  if (idx < zoomLevels.length - 1) {
    scale.value = zoomLevels[idx + 1];
    renderPage(currentPage.value);
  }
}

function zoomOut() {
  const idx = zoomLevels.indexOf(scale.value);
  if (idx > 0) {
    scale.value = zoomLevels[idx - 1];
    renderPage(currentPage.value);
  }
}

function handleTextSelection() {
  const selection = window.getSelection();
  if (selection && selection.toString().trim()) {
    emit('highlight', {
      text: selection.toString(),
      position: `page-${currentPage.value}`,
    });
  }
}

/* ── Lifecycle ── */
onMounted(() => {
  loadPdf();
  document.addEventListener('mouseup', handleTextSelection);
});

onUnmounted(() => {
  document.removeEventListener('mouseup', handleTextSelection);
  if (pdfDoc.value) {
    pdfDoc.value.cleanup();
  }
});

watch(() => props.src, () => {
  loadPdf();
});
</script>

<template>
  <div class="pdf-viewer">
    <!-- Toolbar -->
    <div class="pdf-toolbar">
      <div class="toolbar-left">
        <button @click="prevPage" :disabled="currentPage <= 1" class="toolbar-btn">
          ◀
        </button>
        <span class="page-indicator">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <button @click="nextPage" :disabled="currentPage >= totalPages" class="toolbar-btn">
          ▶
        </button>
      </div>
      <div class="toolbar-right">
        <button @click="zoomOut" :disabled="!canZoomOut" class="toolbar-btn">
          −
        </button>
        <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
        <button @click="zoomIn" :disabled="!canZoomIn" class="toolbar-btn">
          +
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="pdf-loading">
      <div class="spinner"></div>
      <p>Loading PDF...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="pdf-error">
      <span class="error-icon">⚠️</span>
      <p>{{ error }}</p>
    </div>

    <!-- PDF Canvas -->
    <div v-else class="pdf-canvas-container" ref="containerRef">
      <canvas ref="canvasRef" class="pdf-canvas"></canvas>
    </div>

    <!-- Progress Bar -->
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
    </div>
  </div>
</template>

<style scoped>
.pdf-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a1a;
}

.pdf-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #2d2d2d;
  border-bottom: 1px solid #404040;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: #404040;
  color: #e0e0e0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.toolbar-btn:hover:not(:disabled) {
  background: #505050;
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-indicator,
.zoom-level {
  color: #b0b0b0;
  font-size: 12px;
  font-family: monospace;
}

.pdf-canvas-container {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  padding: 20px;
}

.pdf-canvas {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  background: white;
}

.pdf-loading,
.pdf-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #b0b0b0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #404040;
  border-top-color: #7170ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 40px;
  margin-bottom: 16px;
}

.progress-bar {
  height: 3px;
  background: #404040;
}

.progress-fill {
  height: 100%;
  background: #7170ff;
  transition: width 0.2s ease;
}
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/PdfViewer.vue package.json package-lock.json
git commit -m "feat: add PDF.js viewer component with zoom and navigation"
```

---

## Task 8: 前端 - Markdown 阅读器组件

**Files:**
- Create: `src/components/MarkdownViewer.vue`
- Modify: `package.json` (add marked dependency)

- [ ] **Step 1: 安装 marked 依赖**

Run: `npm install marked@^11.1.1 --save`
Expected: Installation successful

- [ ] **Step 2: 实现 MarkdownViewer 组件**

```vue
<!-- src/components/MarkdownViewer.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { marked } from 'marked';

const props = defineProps<{
  content: string;
  enableHighlight?: boolean;
}>();

const emit = defineEmits<{
  (e: 'highlight', selection: { text: string; position: string }): void;
}>();

/* ── State ── */
const containerRef = ref<HTMLDivElement | null>(null);

/* ── Computed ── */
const renderedHtml = computed(() => {
  if (!props.content) return '';
  return marked.parse(props.content) as string;
});

/* ── Methods ── */
function handleTextSelection() {
  if (!props.enableHighlight) return;
  
  const selection = window.getSelection();
  if (selection && selection.toString().trim()) {
    emit('highlight', {
      text: selection.toString(),
      position: 'md-content',
    });
  }
}
</script>

<template>
  <div 
    class="markdown-viewer" 
    ref="containerRef"
    @mouseup="handleTextSelection"
  >
    <div class="markdown-content" v-html="renderedHtml"></div>
  </div>
</template>

<style scoped>
.markdown-viewer {
  height: 100%;
  overflow-y: auto;
  padding: 32px;
  background: #fafafa;
  color: #333;
}

.markdown-content {
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.8;
}

.markdown-content :deep(h1) {
  font-size: 28px;
  font-weight: 600;
  margin: 32px 0 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e0e0e0;
}

.markdown-content :deep(h2) {
  font-size: 22px;
  font-weight: 600;
  margin: 28px 0 12px;
  color: #222;
}

.markdown-content :deep(h3) {
  font-size: 18px;
  font-weight: 600;
  margin: 24px 0 10px;
  color: #333;
}

.markdown-content :deep(p) {
  margin: 16px 0;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 16px 0;
  padding-left: 24px;
}

.markdown-content :deep(li) {
  margin: 8px 0;
}

.markdown-content :deep(code) {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: #d73a49;
}

.markdown-content :deep(pre) {
  background: #1e1e1e;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 20px 0;
}

.markdown-content :deep(pre code) {
  background: none;
  color: #d4d4d4;
  padding: 0;
}

.markdown-content :deep(blockquote) {
  margin: 20px 0;
  padding: 12px 16px;
  background: #f5f5f5;
  border-left: 4px solid #7170ff;
  color: #666;
}

.markdown-content :deep(a) {
  color: #7170ff;
  text-decoration: none;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #e0e0e0;
  padding: 8px 12px;
  text-align: left;
}

.markdown-content :deep(th) {
  background: #f5f5f5;
  font-weight: 600;
}

@media (prefers-color-scheme: dark) {
  .markdown-viewer {
    background: #1a1a1a;
    color: #e0e0e0;
  }
  
  .markdown-content :deep(h1),
  .markdown-content :deep(h2),
  .markdown-content :deep(h3) {
    color: #f0f0f0;
  }
  
  .markdown-content :deep(h1) {
    border-bottom-color: #404040;
  }
  
  .markdown-content :deep(code) {
    background: #2d2d2d;
    color: #ffa657;
  }
  
  .markdown-content :deep(blockquote) {
    background: #2d2d2d;
    color: #b0b0b0;
  }
  
  .markdown-content :deep(table) {
    border-color: #404040;
  }
  
  .markdown-content :deep(th),
  .markdown-content :deep(td) {
    border-color: #404040;
  }
  
  .markdown-content :deep(th) {
    background: #2d2d2d;
  }
}
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/MarkdownViewer.vue package.json package-lock.json
git commit -m "feat: add Markdown viewer component with syntax highlighting"
```

---

## Task 9: 前端 - 笔记编辑器组件

**Files:**
- Create: `src/components/NoteEditor.vue`

- [ ] **Step 1: 实现 NoteEditor 组件**

```vue
<!-- src/components/NoteEditor.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{
  modelValue: string;
  noteType?: 'chapter' | 'reflection';
  placeholder?: string;
  autosave?: boolean;
  autosaveInterval?: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'save', content: string): void;
}>();

/* ── State ── */
const content = ref(props.modelValue || '');
const isEditing = ref(false);
const lastSaved = ref<Date | null>(null);
const showPreview = ref(false);
let autosaveTimer: number | null = null;

/* ── Computed ── */
const charCount = computed(() => content.value.length);
const wordCount = computed(() => {
  const trimmed = content.value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
});

const noteTypeLabel = computed(() => {
  switch (props.noteType) {
    case 'reflection': return '读后感';
    case 'chapter': return '章节笔记';
    default: return '笔记';
  }
});

/* ── Methods ── */
function startEditing() {
  isEditing.value = true;
}

function saveContent() {
  emit('update:modelValue', content.value);
  emit('save', content.value);
  lastSaved.value = new Date();
}

function triggerAutosave() {
  if (props.autosave && content.value.trim()) {
    saveContent();
  }
}

function insertMarkdown(syntax: string) {
  // Simplified - in a real app, would insert at cursor position
  content.value += syntax;
}

function clearContent() {
  if (confirm('确定要清空内容吗？')) {
    content.value = '';
  }
}

/* ── Watch ── */
watch(() => props.modelValue, (newVal) => {
  if (newVal !== content.value) {
    content.value = newVal;
  }
});

watch(content, () => {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  if (props.autosave && props.autosaveInterval) {
    autosaveTimer = window.setTimeout(triggerAutosave, props.autosaveInterval);
  }
}, { deep: true });
</script>

<template>
  <div class="note-editor">
    <!-- Header -->
    <div class="editor-header">
      <div class="editor-title">
        <span class="note-type-badge">{{ noteTypeLabel }}</span>
        <span v-if="lastSaved" class="last-saved">
          已保存: {{ lastSaved.toLocaleTimeString() }}
        </span>
      </div>
      <div class="editor-actions">
        <button 
          class="action-btn preview-btn"
          @click="showPreview = !showPreview"
          :class="{ active: showPreview }"
        >
          {{ showPreview ? '✏️ 编辑' : '👁️ 预览' }}
        </button>
        <button 
          class="action-btn save-btn"
          @click="saveContent"
          :disabled="!content.trim()"
        >
          💾 保存
        </button>
      </div>
    </div>

    <!-- Toolbar (Edit Mode Only) -->
    <div v-if="isEditing && !showPreview" class="editor-toolbar">
      <button class="toolbar-btn" @click="insertMarkdown('**bold**')" title="粗体">B</button>
      <button class="toolbar-btn" @click="insertMarkdown('*italic*')" title="斜体">I</button>
      <button class="toolbar-btn" @click="insertMarkdown('# Heading')" title="标题">H</button>
      <button class="toolbar-btn" @click="insertMarkdown('- list item')" title="列表">•</button>
      <button class="toolbar-btn" @click="insertMarkdown('[text](url)')" title="链接">🔗</button>
      <button class="toolbar-btn" @click="insertMarkdown('`code`')" title="代码">{'</>'}</button>
      <button class="toolbar-btn" @click="insertMarkdown('> quote')" title="引用">❝</button>
      <div class="toolbar-spacer"></div>
      <button class="toolbar-btn clear-btn" @click="clearContent" title="清空">🗑️</button>
    </div>

    <!-- Editor / Preview -->
    <div class="editor-body">
      <!-- Edit Mode -->
      <textarea
        v-if="!showPreview"
        v-model="content"
        class="note-textarea"
        :placeholder="placeholder || '在此写下你的笔记...'"
        @focus="startEditing"
      ></textarea>

      <!-- Preview Mode -->
      <div v-else class="note-preview">
        <div v-if="!content" class="empty-preview">
          <span class="empty-icon">📝</span>
          <p>暂无笔记内容</p>
        </div>
        <div v-else class="preview-content">
          <!-- Simple markdown rendering (can be enhanced) -->
          <div v-html="content.replace(/\n/g, '<br>')"></div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="editor-footer">
      <div class="stats">
        <span class="stat">{{ wordCount }} 词</span>
        <span class="stat">{{ charCount }} 字符</span>
      </div>
      <div class="mode-indicator">
        {{ isEditing ? '✏️ 编辑中' : '点击开始编辑' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.note-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.editor-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.note-type-badge {
  padding: 4px 10px;
  background: #7170ff;
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.last-saved {
  font-size: 11px;
  color: #888;
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  background: white;
  color: #555;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  border-color: #7170ff;
  color: #7170ff;
}

.action-btn.active {
  background: #7170ff;
  color: white;
  border-color: #7170ff;
}

.action-btn.save-btn {
  background: #7170ff;
  color: white;
  border-color: #7170ff;
}

.action-btn.save-btn:hover:not(:disabled) {
  background: #5a59e0;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.toolbar-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar-btn:hover {
  background: #f0f0f0;
  border-color: #7170ff;
}

.toolbar-btn.clear-btn:hover {
  background: #fff5f5;
  border-color: #ef4444;
}

.toolbar-spacer {
  flex: 1;
}

.editor-body {
  flex: 1;
  min-height: 200px;
  position: relative;
}

.note-textarea {
  width: 100%;
  height: 100%;
  min-height: 250px;
  border: none;
  outline: none;
  padding: 16px;
  font-size: 14px;
  line-height: 1.8;
  resize: none;
  font-family: inherit;
}

.note-textarea::placeholder {
  color: #aaa;
}

.note-preview {
  padding: 16px;
  min-height: 250px;
}

.empty-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #aaa;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.preview-content {
  line-height: 1.8;
  color: #333;
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
  font-size: 11px;
  color: #888;
}

.stats {
  display: flex;
  gap: 16px;
}

.mode-indicator {
  font-style: italic;
}

@media (prefers-color-scheme: dark) {
  .note-editor {
    background: #1e1e1e;
    border-color: #404040;
  }
  
  .editor-header,
  .editor-toolbar,
  .editor-footer {
    background: #252525;
    border-color: #404040;
  }
  
  .action-btn {
    background: #2d2d2d;
    border-color: #404040;
    color: #b0b0b0;
  }
  
  .action-btn:hover:not(:disabled) {
    background: #3a3a3a;
  }
  
  .toolbar-btn {
    background: #2d2d2d;
    border-color: #404040;
    color: #b0b0b0;
  }
  
  .note-textarea {
    background: #1e1e1e;
    color: #e0e0e0;
  }
  
  .preview-content {
    color: #e0e0e0;
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/NoteEditor.vue
git commit -m "feat: add note editor component with markdown support"
```

---

## Task 10: 前端 - CourseReader 主组件

**Files:**
- Create: `src/components/CourseReader.vue`

- [ ] **Step 1: 实现 CourseReader 主组件**

```vue
<!-- src/components/CourseReader.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import PdfViewer from './PdfViewer.vue';
import MarkdownViewer from './MarkdownViewer.vue';
import NoteEditor from './NoteEditor.vue';
import { useBooks, type Book } from '../composables/useBooks';
import { useLearning, type Note, type Highlight } from '../composables/useLearning';

const props = defineProps<{
  book?: Book | null;
  markdownContent?: string;
  areaId: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

/* ── State ── */
const activeTab = ref<'reader' | 'notes' | 'highlights'>('reader');
const sidebarOpen = ref(true);
const notes = ref<Note[]>([]);
const highlights = ref<Highlight[]>([]);
const currentProgress = ref(0);
const readingStartTime = ref<Date | null>(null);

const { getBookViewUrl } = useBooks();
const { 
  fetchNotes, 
  createNote, 
  updateNote, 
  fetchHighlights, 
  addHighlight,
  saveProgress,
  fetchProgress 
} = useLearning();

/* ── Computed ── */
const viewerSource = computed(() => {
  if (props.markdownContent) return props.markdownContent;
  if (props.book) return getBookViewUrl(props.book.id);
  return '';
});

const isPdf = computed(() => props.book?.file_format === 'pdf');
const isMarkdown = computed(() => !!props.markdownContent);

const chapterNotes = computed(() => 
  notes.value.filter(n => n.note_type === 'chapter')
);

const reflectionNotes = computed(() => 
  notes.value.filter(n => n.note_type === 'reflection')
);

/* ── Methods ── */
async function loadData() {
  if (!props.areaId) return;
  
  const [fetchedNotes, fetchedHighlights, progress] = await Promise.all([
    fetchNotes(props.areaId),
    fetchHighlights(props.areaId),
    fetchProgress(props.areaId),
  ]);
  
  notes.value = fetchedNotes;
  highlights.value = fetchedHighlights;
  currentProgress.value = progress;
  readingStartTime.value = new Date();
}

function handlePageChange(page: number) {
  // Track reading progress based on page
  if (props.book) {
    saveProgress(props.areaId, page);
  }
}

function handleProgressChange(progress: number) {
  currentProgress.value = progress;
}

async function handleHighlight(selection: { text: string; position: string }) {
  if (!props.areaId) return;
  
  const id = await addHighlight({
    content: selection.text,
    position: selection.position,
    color: '#ffeb3b',
  });
  
  if (id) {
    // Refresh highlights
    highlights.value = await fetchHighlights(props.areaId);
  }
}

async function handleNoteSave(content: string) {
  if (!props.areaId || !content.trim()) return;
  
  // Check if we have an existing chapter note to update
  const existingNote = notes.value.find(n => n.note_type === 'chapter');
  
  if (existingNote) {
    await updateNote(existingNote.id, content);
  } else {
    await createNote({
      note_type: 'chapter',
      content,
    });
  }
  
  // Refresh notes
  notes.value = await fetchNotes(props.areaId);
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

/* ── Lifecycle ── */
onMounted(() => {
  loadData();
});

watch(() => props.areaId, () => {
  loadData();
});
</script>

<template>
  <div class="course-reader">
    <!-- Header -->
    <div class="reader-header">
      <div class="header-left">
        <button class="close-btn" @click="emit('close')">✕</button>
        <h2 class="book-title">{{ book?.title || '课程阅读' }}</h2>
      </div>
      <div class="header-right">
        <div class="progress-badge">
          <span class="progress-icon">📖</span>
          <span class="progress-text">{{ currentProgress }}% 已读</span>
        </div>
        <button 
          class="sidebar-toggle" 
          @click="toggleSidebar"
          :class="{ open: sidebarOpen }"
        >
          {{ sidebarOpen ? '◀' : '▶' }}
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="reader-body">
      <!-- Viewer Area -->
      <div class="viewer-section" :class="{ 'sidebar-open': sidebarOpen }">
        <!-- PDF Viewer -->
        <PdfViewer 
          v-if="isPdf"
          :src="viewerSource"
          @page-change="handlePageChange"
          @progress-change="handleProgressChange"
          @highlight="handleHighlight"
        />
        
        <!-- Markdown Viewer -->
        <MarkdownViewer 
          v-else-if="isMarkdown"
          :content="viewerSource"
          :enable-highlight="true"
          @highlight="handleHighlight"
        />
        
        <!-- Empty State -->
        <div v-else class="empty-viewer">
          <span class="empty-icon">📚</span>
          <p>选择一本书籍开始阅读</p>
        </div>
      </div>

      <!-- Sidebar (Notes / Highlights) -->
      <div v-if="sidebarOpen" class="sidebar-section">
        <!-- Tabs -->
        <div class="sidebar-tabs">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'notes' }"
            @click="activeTab = 'notes'"
          >
            📝 笔记 ({{ notes.length }})
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'highlights' }"
            @click="activeTab = 'highlights'"
          >
            🎨 高亮 ({{ highlights.length }})
          </button>
        </div>

        <!-- Notes Tab Content -->
        <div v-if="activeTab === 'notes'" class="tab-content">
          <div class="notes-section">
            <h4>章节笔记</h4>
            <NoteEditor 
              :model-value="chapterNotes[0]?.content || ''"
              note-type="chapter"
              :autosave="true"
              :autosave-interval="3000"
              @save="handleNoteSave"
            />
          </div>
          
          <div class="notes-section" style="margin-top: 20px;">
            <h4>读后感</h4>
            <NoteEditor 
              :model-value="reflectionNotes[0]?.content || ''"
              note-type="reflection"
              :autosave="true"
              :autosave-interval="5000"
              placeholder="写下你的阅读感悟..."
              @save="handleNoteSave"
            />
          </div>
        </div>

        <!-- Highlights Tab Content -->
        <div v-else-if="activeTab === 'highlights'" class="tab-content">
          <div v-if="!highlights.length" class="empty-highlights">
            <span class="empty-icon">🎨</span>
            <p>选中文本添加高亮标记</p>
          </div>
          <div v-else class="highlights-list">
            <div 
              v-for="hl in highlights" 
              :key="hl.id" 
              class="highlight-item"
              :style="{ borderLeftColor: hl.color }"
            >
              <p class="highlight-text">{{ hl.content }}</p>
              <span class="highlight-position">{{ hl.position }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.course-reader {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #0a0a0a;
}

.reader-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #141414;
  border-bottom: 1px solid #2a2a2a;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: #2a2a2a;
  color: #b0b0b0;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #3a3a3a;
  color: #fff;
}

.book-title {
  font-size: 16px;
  font-weight: 500;
  color: #e0e0e0;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #2a2a2a;
  border-radius: 16px;
  font-size: 12px;
  color: #b0b0b0;
}

.sidebar-toggle {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: #2a2a2a;
  color: #b0b0b0;
  cursor: pointer;
  font-size: 14px;
}

.sidebar-toggle:hover {
  background: #3a3a3a;
}

.reader-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.viewer-section {
  flex: 1;
  overflow: hidden;
  transition: all 0.3s ease;
}

.viewer-section.sidebar-open {
  flex: 0 0 calc(100% - 380px);
}

.empty-viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.sidebar-section {
  flex: 0 0 380px;
  background: #141414;
  border-left: 1px solid #2a2a2a;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid #2a2a2a;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  border: none;
  background: none;
  color: #888;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: #1a1a1a;
  color: #b0b0b0;
}

.tab-btn.active {
  color: #7170ff;
  border-bottom: 2px solid #7170ff;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.notes-section h4 {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 500;
  color: #888;
}

.empty-highlights {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
  text-align: center;
}

.highlights-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.highlight-item {
  padding: 12px;
  background: #1a1a1a;
  border-radius: 6px;
  border-left: 3px solid #ffeb3b;
}

.highlight-text {
  margin: 0 0 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #e0e0e0;
}

.highlight-position {
  font-size: 11px;
  color: #666;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CourseReader.vue
git commit -m "feat: add CourseReader main component with notes and highlights"
```

---

## Task 11: 前端 - AreasView 课程 Tab 集成

**Files:**
- Modify: `src/views/AreasView.vue` (添加课程 Tab)

- [ ] **Step 1: 修改 AreasView.vue 添加课程功能**

```vue
<!-- 在 AreasView.vue 中添加课程 Tab (参考设计文档 §5.1) -->

<template>
  <div class="areas-view">
    <!-- 现有 Area selector 和概览内容 -->
    <!-- ... -->
    
    <!-- Tab 导航 -->
    <div class="tabs">
      <button 
        class="tab" 
        :class="{ active: activeTab === 'overview' }"
        @click="activeTab = 'overview'"
      >
        概览
      </button>
      <button 
        class="tab" 
        :class="{ active: activeTab === 'projects' }"
        @click="activeTab = 'projects'"
      >
        项目
      </button>
      <button 
        class="tab" 
        :class="{ active: activeTab === 'courses' }"
        @click="activeTab = 'courses'"
      >
        📚 课程
      </button>
    </div>

    <!-- 课程 Tab 内容 -->
    <div v-if="activeTab === 'courses'" class="courses-tab">
      <!-- 搜索栏 -->
      <div class="search-section">
        <input 
          type="text" 
          class="search-input"
          v-model="searchQuery"
          placeholder="搜索书籍..."
          @input="handleSearch"
        />
        <button class="index-btn" @click="triggerIndex">
          🔄 扫描书籍
        </button>
      </div>

      <!-- 最近添加的书籍 -->
      <div class="course-section">
        <h3 class="section-title">📖 最近添加</h3>
        <div v-if="loadingBooks" class="loading-state">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>
        <div v-else-if="recentBooks.length === 0" class="empty-state">
          <span class="empty-icon">📚</span>
          <p>暂无书籍，点击"扫描书籍"开始索引</p>
        </div>
        <div v-else class="books-grid">
          <div 
            v-for="book in recentBooks" 
            :key="book.id" 
            class="book-card"
            @click="openBook(book)"
          >
            <div class="book-icon">📕</div>
            <div class="book-info">
              <h4 class="book-title">{{ book.title }}</h4>
              <span class="book-format">{{ book.file_format.toUpperCase() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 搜索结果 -->
      <div v-if="searchResults.length > 0" class="course-section">
        <h3 class="section-title">🔍 搜索结果</h3>
        <div class="books-grid">
          <div 
            v-for="book in searchResults" 
            :key="book.id" 
            class="book-card"
            @click="openBook(book)"
          >
            <div class="book-icon">📕</div>
            <div class="book-info">
              <h4 class="book-title">{{ book.title }}</h4>
              <span class="book-format">{{ book.file_format.toUpperCase() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Course Reader Modal -->
    <div v-if="selectedBook" class="reader-modal">
      <div class="modal-backdrop" @click="closeReader"></div>
      <div class="modal-content">
        <CourseReader 
          :book="selectedBook" 
          :area-id="selectedAreaId"
          @close="closeReader"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import CourseReader from '../components/CourseReader.vue';
import { useBooks, type Book } from '../composables/useBooks';

/* ── State ── */
const activeTab = ref('overview');
const searchQuery = ref('');
const recentBooks = ref<Book[]>([]);
const searchResults = ref<Book[]>([]);
const loadingBooks = ref(false);
const selectedBook = ref<Book | null>(null);
const selectedAreaId = ref('default-area'); // Replace with actual area ID from context

const { getRecentBooks, searchBooks, indexBooks } = useBooks();

/* ── Methods ── */
async function loadRecentBooks() {
  loadingBooks.value = true;
  try {
    recentBooks.value = await getRecentBooks(12);
  } finally {
    loadingBooks.value = false;
  }
}

async function handleSearch() {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }
  searchResults.value = await searchBooks(searchQuery.value, 10);
}

async function triggerIndex() {
  loadingBooks.value = true;
  try {
    await indexBooks();
    await loadRecentBooks();
  } finally {
    loadingBooks.value = false;
  }
}

function openBook(book: Book) {
  selectedBook.value = book;
}

function closeReader() {
  selectedBook.value = null;
}

/* ── Lifecycle ── */
onMounted(() => {
  loadRecentBooks();
});
</script>

<style scoped>
/* 添加课程 Tab 相关样式 */
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  border-bottom: 1px solid #2a2a2a;
}

.tab {
  padding: 10px 20px;
  border: none;
  background: none;
  color: #888;
  cursor: pointer;
  font-size: 14px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab:hover {
  color: #b0b0b0;
}

.tab.active {
  color: #7170ff;
  border-bottom-color: #7170ff;
}

.search-section {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.search-input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  background: #141414;
  color: #e0e0e0;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #7170ff;
}

.index-btn {
  padding: 10px 20px;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  background: #141414;
  color: #b0b0b0;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.index-btn:hover {
  border-color: #7170ff;
  color: #7170ff;
}

.course-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 15px;
  font-weight: 500;
  color: #e0e0e0;
  margin: 0 0 16px;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.book-card {
  padding: 16px;
  background: #141414;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 12px;
}

.book-card:hover {
  border-color: #7170ff;
  transform: translateY(-2px);
}

.book-icon {
  font-size: 32px;
}

.book-info {
  flex: 1;
  min-width: 0;
}

.book-title {
  font-size: 13px;
  font-weight: 500;
  color: #e0e0e0;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-format {
  font-size: 11px;
  color: #666;
  background: #2a2a2a;
  padding: 2px 6px;
  border-radius: 4px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #2a2a2a;
  border-top-color: #7170ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* Reader Modal */
.reader-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
}

.modal-content {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
```

- [ ] **Step 2: 检查 AreasView.vue 并进行适当修改**

> 注意：根据现有 AreasView.vue 的实际结构，可能需要调整集成方式。上述代码是完整的课程功能片段，需要与现有代码合并。

- [ ] **Step 3: Commit**

```bash
git add src/views/AreasView.vue
git commit -m "feat: integrate courses tab into AreasView"
```

---

## Task 12: 构建与端到端测试

- [ ] **Step 1: 前端构建**

Run: `npm run build`
Expected: Build successful with no errors

- [ ] **Step 2: 后端启动与 API 测试**

Run: `cd console-api && node server.mjs`
Expected: Server starts successfully on port 3300

Run (in separate terminal): `curl -s http://localhost:3300/api/books/recent | head -10`
Expected: Valid JSON response

- [ ] **Step 3: 运行后端测试**

Run: `node --test console-api/tests/*.mjs`
Expected: All tests pass

- [ ] **Step 4: 完整测试流程**

1. 访问 Areas 页面
2. 点击 "课程" Tab
3. 点击 "扫描书籍" 按钮
4. 验证书籍列表显示
5. 搜索一本书籍
6. 点击书籍卡片打开阅读器
7. 验证 PDF 内容正常显示
8. 翻页验证进度追踪
9. 打开笔记侧边栏
10. 编辑并保存笔记
11. 选中文本添加高亮
12. 验证高亮列表更新

- [ ] **Step 5: 最终 Commit**

```bash
git add .
git commit -m "feat: complete learning system integration - Phase 1 MVP"
```

---

## 🏁 计划完成

**Phase 1 已实现功能：**
- ✅ 后端 SQLite 数据库初始化
- ✅ NAS 书籍索引与读取 API
- ✅ 学习笔记与进度追踪 API
- ✅ useBooks / useLearning composables
- ✅ PDF.js 阅读器组件（翻页、缩放、进度）
- ✅ Markdown 阅读器组件
- ✅ 笔记编辑器组件
- ✅ CourseReader 主组件
- ✅ AreasView 课程 Tab 集成

**后续 Phase 2/3 可扩展功能：**
- 边注锚点系统
- 主动回忆卡片与 SM-2 间隔复习
- GitHub 开源课程内容抓取
- 智能关联 Notion 图书馆内容
- 知识图谱可视化
