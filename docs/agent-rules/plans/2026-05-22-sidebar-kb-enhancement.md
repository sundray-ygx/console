# Console 侧边栏持久化 + Hermes 知识库增强 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 侧边栏折叠持久化、知识库面板收缩、文件管理（上传/下载/新建/重命名/删除）

**Architecture:** 后端 Fastify 新增 5 个文件操作端点 + multipart 上传支持；前端在现有组件上叠加操作 UI，无新依赖引入。

**Tech Stack:** Vue 3.5 + TypeScript (前端), Fastify 5 + @fastify/multipart (后端), Linear 设计风格 CSS

**Conventions (learned from codebase):**
- 前端: Vue 3 `<script setup>` + TypeScript, CSS scoped, CSS custom properties (var(--xxx))
- 后端: Fastify 5 ESM (server.mjs 单文件), import from 'fs/promises' and 'path'
- 命名: camelCase (前端), camelCase (后端 JS)
- 错误处理: 后端 `reply.code(N).send({ error: msg })`, 前端 composable 返回 `error` ref
- 测试: 后端 `node --test tests/*.mjs`, 前端无测试框架（通过 build 验证）
- 路径安全: `isPathSafe()` 防路径遍历，resolve 后必须 `startsWith(KB_ROOT)`

**Domain Skills (from session context):**
- 单测编写: None — 后端用 node --test，前端用 build 验证
- 测试方法: None — 手动 curl 验证端点
- 排障调试: `systematic-debugging` — 证据优先排查
- 代码编写: None — 遵循现有代码风格

---

## Task 1: 侧边栏折叠状态持久化

**Files:**
- Modify: `src/App.vue:6`

**Test Cases:**

| ID | Source | Type | Preconditions/Input | Expected Assertions | Automation | Test Target | Command |
|---|---|---|---|---|---|---|---|
| TC-101 | Part 1 | normal | localStorage 设为 `'false'`, 刷新页面 | `sidebarExpanded` 初始值为 `false` | manual | 浏览器检查侧边栏折叠状态 | `npm run build` |
| TC-102 | Part 1 | normal | 点击折叠按钮, 刷新页面 | 刷新后保持折叠状态 | manual | 浏览器检查 | `npm run build` |

- [ ] **Step 1: Modify App.vue to persist sidebar state**

  在 `src/App.vue` 中修改 `sidebarExpanded` 的初始值：

  ```ts
  // 原: const sidebarExpanded = ref(true)
  // 改为:
  const sidebarExpanded = ref(localStorage.getItem('console-sidebar') !== 'false')
  ```

  在 `sidebarExpanded` 的 watch 中添加持久化（找到 `@toggle` 处理位置）：

  ```ts
  // 在 template 中修改 toggle 处理:
  // @toggle="sidebarExpanded = !sidebarExpanded"
  // 改为调用函数:
  function toggleSidebar() {
    sidebarExpanded.value = !sidebarExpanded.value
    localStorage.setItem('console-sidebar', String(sidebarExpanded.value))
  }
  ```

  更新 template 中的引用：`@toggle="toggleSidebar"`。

- [ ] **Step 2: Build and verify**

  Run: `npm run build`
  Expected: 构建成功，无错误

- [ ] **Step 3: Commit**

  ```bash
  git add src/App.vue
  git commit -m "feat: persist sidebar collapse state to localStorage"
  ```

---

## Task 2: 知识库面板收缩功能

**Files:**
- Modify: `src/views/KbView.vue`

**Test Cases:**

| ID | Source | Type | Preconditions/Input | Expected Assertions | Automation | Test Target | Command |
|---|---|---|---|---|---|---|---|
| TC-201 | Part 2 | normal | 点击收缩按钮 | 文件树面板隐藏, Markdown 面板占满 | manual | 浏览器检查 | `npm run build` |
| TC-202 | Part 2 | normal | 收缩后刷新页面 | 保持收缩状态 | manual | 浏览器检查 | `npm run build` |

- [ ] **Step 1: Add treeCollapsed state to KbView.vue script**

  在 `<script setup>` 中添加：

  ```ts
  const treeCollapsed = ref(localStorage.getItem('console-kb-tree-collapsed') === 'true')

  function toggleTree() {
    treeCollapsed.value = !treeCollapsed.value
    localStorage.setItem('console-kb-tree-collapsed', String(treeCollapsed.value))
  }
  ```

- [ ] **Step 2: Update template — add collapse buttons and conditional rendering**

  在 `.kb-layout` div 上添加动态 class：
  ```html
  <div v-else class="kb-layout" :class="{ 'tree-hidden': treeCollapsed }">
  ```

  在文件树面板顶部添加收缩按钮（在 `tree-header` 内）：
  ```html
  <div class="tree-header">
    <span class="tree-title">📁 knowledge/</span>
    <button class="tree-toggle" @click="toggleTree" title="收缩面板">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
    </button>
  </div>
  ```

  收缩时在 Markdown 面板顶部添加展开按钮：
  ```html
  <div class="md-header">
    <button v-if="treeCollapsed" class="tree-expand-btn" @click="toggleTree" title="展开文件树">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      <span>文件树</span>
    </button>
    <span class="md-path">{{ selectedPath || '未选择文件' }}</span>
  </div>
  ```

  在文件树面板外层包裹 `v-if`：
  ```html
  <!-- 将 tree-panel 包裹: -->
  <div v-if="!treeCollapsed" class="tree-panel">
  ```

- [ ] **Step 3: Add CSS for collapsed state**

  在 `<style scoped>` 中添加：

  ```css
  .kb-layout.tree-hidden {
    grid-template-columns: 1fr;
  }
  .tree-toggle {
    background: none; border: none; color: var(--text-quaternary);
    cursor: pointer; padding: 2px; display: flex; align-items: center;
    transition: color 0.15s; margin-left: auto;
  }
  .tree-toggle:hover { color: var(--text-secondary); }
  .tree-expand-btn {
    display: inline-flex; align-items: center; gap: 4px;
    background: none; border: 1px solid var(--border-subtle);
    border-radius: 4px; padding: 2px 8px; color: var(--text-quaternary);
    cursor: pointer; font-size: 11px; margin-right: 8px; transition: all 0.15s;
  }
  .tree-expand-btn:hover { background: var(--hover-bg); color: var(--text-secondary); }
  ```

- [ ] **Step 4: Build and verify**

  Run: `npm run build`
  Expected: 构建成功

- [ ] **Step 5: Commit**

  ```bash
  git add src/views/KbView.vue
  git commit -m "feat: collapsible file tree panel in Hermes KB"
  ```

---

## Task 3: 后端 — buildTree 显示所有文件类型

**Files:**
- Modify: `console-api/server.mjs:885-903`

**Test Cases:**

| ID | Source | Type | Preconditions/Input | Expected Assertions | Automation | Test Target | Command |
|---|---|---|---|---|---|---|---|
| TC-301 | Part 3 buildTree | normal | `GET /api/fs/tree` | 返回所有文件类型（含 .pdf, .png 等），不限于 .md | API | `curl localhost:3300/api/fs/tree` | `curl -s localhost:3300/api/fs/tree \| grep -c pdf` |

- [ ] **Step 1: Modify buildTree filter**

  在 `console-api/server.mjs` 中修改 `buildTree` 函数（约第 898 行）：

  ```js
  // 原: } else if (entry.name.endsWith('.md')) {
  // 改为: } else {
  ```

  即删除 `.endsWith('.md')` 过滤，所有文件都包含在树中。同时修改 `/api/fs/recent` 端点中的相同过滤（约第 928 行）：

  ```js
  // 原: } else if (entry.name.endsWith('.md')) {
  // 改为: } else {
  ```

- [ ] **Step 2: Modify /api/fs/file endpoint to handle non-md files**

  修改约第 955 行的 `.md` 限制。非 `.md` 文件返回元信息而非渲染：

  ```js
  // 删除: if (extname(path) !== '.md') { return reply.code(400).send({ error: 'Only .md files are supported' }); }
  // 替换为:
  const fullPath = join(KB_ROOT, path);
  const stats = await stat(fullPath);

  if (extname(path) === '.md') {
    const content = await readFile(fullPath, 'utf-8');
    return {
      name: path.split('/').pop(),
      path,
      content: marked(content),
      lastModified: stats.mtime.toISOString(),
    };
  } else {
    return {
      name: path.split('/').pop(),
      path,
      size: stats.size,
      lastModified: stats.mtime.toISOString(),
      isBinary: true,
    };
  }
  ```

- [ ] **Step 3: Verify with curl**

  Run: `node -e "fetch('http://localhost:3300/api/fs/tree').then(r=>r.json()).then(d=>console.log(JSON.stringify(d.tree).substring(0,200)))"`
  Expected: 包含非 .md 文件

- [ ] **Step 4: Commit**

  ```bash
  git add console-api/server.mjs
  git commit -m "feat: show all file types in KB tree and file endpoint"
  ```

---

## Task 4: 后端 — 文件操作 API（upload/download/mkdir/rename/delete）

**Files:**
- Modify: `console-api/server.mjs` (新增 5 个端点 + imports)
- Modify: `console-api/package.json` (添加 @fastify/multipart)

**Test Cases:**

| ID | Source | Type | Preconditions/Input | Expected Assertions | Automation | Test Target | Command |
|---|---|---|---|---|---|---|---|
| TC-401 | POST /api/fs/upload | normal | 上传 test.txt 到 inbox/ | 200, 文件存在于磁盘 | API | curl upload | `curl -F "file=@test.txt" -F "targetDir=inbox" localhost:3300/api/fs/upload` |
| TC-402 | POST /api/fs/upload | exception | targetDir 含 `..` | 403 Access denied | API | curl upload | `curl -F "file=@test.txt" -F "targetDir=../etc" localhost:3300/api/fs/upload` |
| TC-403 | GET /api/fs/download | normal | 下载已有 .md 文件 | 200, Content-Disposition header 存在 | API | curl download | `curl -I "localhost:3300/api/fs/download?path=inbox/test.txt"` |
| TC-404 | GET /api/fs/download | exception | 路径含 `..` | 403 Access denied | API | curl download | `curl "localhost:3300/api/fs/download?path=../../etc/passwd"` |
| TC-405 | POST /api/fs/mkdir | normal | 创建 `test-dir/` | 200, 目录存在 | API | curl mkdir | `curl -X POST -H "Content-Type: application/json" -d '{"path":"test-dir"}' localhost:3300/api/fs/mkdir` |
| TC-406 | POST /api/fs/mkdir | exception | 已存在的目录 | 400 Directory already exists | API | curl mkdir | 同上重复调用 |
| TC-407 | POST /api/fs/rename | normal | 重命名文件 | 200, 新路径存在 | API | curl rename | `curl -X POST -H "Content-Type: application/json" -d '{"oldPath":"test.txt","newPath":"test2.txt"}' localhost:3300/api/fs/rename` |
| TC-408 | POST /api/fs/rename | exception | 目标已存在 | 400 Target already exists | API | curl rename | 重命名为已存在文件 |
| TC-409 | DELETE /api/fs/file | normal | 删除文件 | 200, 文件不存在 | API | curl delete | `curl -X DELETE "localhost:3300/api/fs/file?path=test.txt"` |
| TC-410 | DELETE /api/fs/file | exception | 删除非空目录 | 400 Directory not empty | API | curl delete | 删除含文件的目录 |
| TC-411 | DELETE /api/fs/file | exception | 路径含 `..` | 403 Access denied | API | curl delete | 路径遍历尝试 |

- [ ] **Step 1: Install @fastify/multipart**

  Run: `cd /root/.hermes/projects/console-api && npm install @fastify/multipart`

- [ ] **Step 2: Add multipart plugin registration in server.mjs**

  在 server.mjs 顶部 import 区域添加：
  ```js
  import multipart from '@fastify/multipart';
  ```

  在 Fastify 实例创建后注册：
  ```js
  app.register(multipart, {
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
  });
  ```

- [ ] **Step 3: Add fs/promises imports for write operations**

  在现有 import 行（第 7 行）修改：
  ```js
  // 原: import { readdir, readFile, stat } from 'fs/promises';
  // 改为:
  import { readdir, readFile, writeFile, stat, mkdir as mkdirFs, rename as renameFs, unlink, rmdir } from 'fs/promises';
  ```
  同时添加 `existsSync` 和 `createReadStream`：
  ```js
  import { existsSync, createReadStream } from 'fs';
  import { pipeline } from 'stream/promises';
  ```

- [ ] **Step 4: Add POST /api/fs/upload endpoint**

  在 `/api/fs/file` 端点之后添加：

  ```js
  // POST /api/fs/upload
  app.post('/api/fs/upload', async (req, reply) => {
    try {
      const data = await req.file();
      if (!data) return reply.code(400).send({ error: 'No file provided' });

      const targetDir = data.fields.targetDir?.value || '';
      if (targetDir && !isPathSafe(targetDir)) {
        return reply.code(403).send({ error: 'Access denied' });
      }

      const targetPath = join(KB_ROOT, targetDir);
      if (!existsSync(targetPath)) {
        return reply.code(400).send({ error: 'Target directory not found' });
      }

      let filename = data.filename;
      let fullPath = join(targetPath, filename);
      // 如果同名文件存在，追加时间戳
      if (existsSync(fullPath)) {
        const ext = extname(filename);
        const base = filename.slice(0, -ext.length || undefined);
        filename = `${base}-${Date.now()}${ext}`;
        fullPath = join(targetPath, filename);
      }

      const buffer = await data.toBuffer();
      await writeFile(fullPath, buffer);

      const relPath = targetDir ? `${targetDir}/${filename}` : filename;
      return { path: relPath, name: filename, size: buffer.length };
    } catch (e) {
      if (e.code === 'FST_REQ_FILE_TOO_LARGE') {
        return reply.code(413).send({ error: 'File too large (max 50MB)' });
      }
      reply.code(500).send({ error: e.message });
    }
  });
  ```

- [ ] **Step 5: Add GET /api/fs/download endpoint**

  ```js
  // GET /api/fs/download
  app.get('/api/fs/download', async (req, reply) => {
    try {
      const path = req.query.path;
      if (!path) return reply.code(400).send({ error: 'Missing path parameter' });
      if (!isPathSafe(path)) return reply.code(403).send({ error: 'Access denied' });

      const fullPath = join(KB_ROOT, path);
      if (!existsSync(fullPath)) return reply.code(404).send({ error: 'File not found' });

      const stats = await stat(fullPath);
      if (stats.isDirectory()) return reply.code(400).send({ error: 'Cannot download directory' });

      const filename = path.split('/').pop();
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      reply.header('Content-Length', stats.size);

      const stream = createReadStream(fullPath);
      return reply.send(stream);
    } catch (e) {
      reply.code(500).send({ error: e.message });
    }
  });
  ```

- [ ] **Step 6: Add POST /api/fs/mkdir endpoint**

  ```js
  // POST /api/fs/mkdir
  app.post('/api/fs/mkdir', async (req, reply) => {
    try {
      const { path } = req.body || {};
      if (!path) return reply.code(400).send({ error: 'Missing path parameter' });
      if (!isPathSafe(path)) return reply.code(403).send({ error: 'Access denied' });

      const fullPath = join(KB_ROOT, path);
      if (existsSync(fullPath)) return reply.code(400).send({ error: 'Directory already exists' });

      await mkdirFs(fullPath, { recursive: true });
      return { path, name: path.split('/').pop() };
    } catch (e) {
      reply.code(500).send({ error: e.message });
    }
  });
  ```

- [ ] **Step 7: Add POST /api/fs/rename endpoint**

  ```js
  // POST /api/fs/rename
  app.post('/api/fs/rename', async (req, reply) => {
    try {
      const { oldPath, newPath } = req.body || {};
      if (!oldPath || !newPath) return reply.code(400).send({ error: 'Missing oldPath or newPath' });
      if (!isPathSafe(oldPath) || !isPathSafe(newPath)) return reply.code(403).send({ error: 'Access denied' });

      const oldFull = join(KB_ROOT, oldPath);
      const newFull = join(KB_ROOT, newPath);

      if (!existsSync(oldFull)) return reply.code(400).send({ error: 'Source not found' });
      if (existsSync(newFull)) return reply.code(400).send({ error: 'Target already exists' });

      await renameFs(oldFull, newFull);
      return { path: newPath, name: newPath.split('/').pop() };
    } catch (e) {
      reply.code(500).send({ error: e.message });
    }
  });
  ```

- [ ] **Step 8: Add DELETE /api/fs/file endpoint**

  ```js
  // DELETE /api/fs/file
  app.delete('/api/fs/file', async (req, reply) => {
    try {
      const path = req.query.path;
      if (!path) return reply.code(400).send({ error: 'Missing path parameter' });
      if (!isPathSafe(path)) return reply.code(403).send({ error: 'Access denied' });

      const fullPath = join(KB_ROOT, path);
      if (!existsSync(fullPath)) return reply.code(404).send({ error: 'File not found' });

      const stats = await stat(fullPath);
      if (stats.isDirectory()) {
        const entries = await readdir(fullPath);
        if (entries.length > 0) return reply.code(400).send({ error: 'Directory not empty' });
        await rmdir(fullPath);
      } else {
        await unlink(fullPath);
      }

      return { ok: true };
    } catch (e) {
      reply.code(500).send({ error: e.message });
    }
  });
  ```

- [ ] **Step 9: Verify all endpoints with curl**

  创建测试文件并逐个测试：
  ```bash
  echo "test content" > /tmp/test-upload.txt
  # Upload
  curl -F "file=@/tmp/test-upload.txt" -F "targetDir=inbox" http://localhost:3300/api/fs/upload
  # Download
  curl -I "http://localhost:3300/api/fs/download?path=inbox/test-upload.txt"
  # Mkdir
  curl -X POST -H "Content-Type: application/json" -d '{"path":"inbox/test-dir"}' http://localhost:3300/api/fs/mkdir
  # Rename
  curl -X POST -H "Content-Type: application/json" -d '{"oldPath":"inbox/test-upload.txt","newPath":"inbox/test-renamed.txt"}' http://localhost:3300/api/fs/rename
  # Delete
  curl -X DELETE "http://localhost:3300/api/fs/file?path=inbox/test-renamed.txt"
  curl -X DELETE "http://localhost:3300/api/fs/file?path=inbox/test-dir"
  ```

- [ ] **Step 10: Commit**

  ```bash
  git add console-api/server.mjs console-api/package.json console-api/package-lock.json
  git commit -m "feat: add file management API (upload/download/mkdir/rename/delete)"
  ```

---

## Task 5: 前端 — FileTree 操作菜单（下载/重命名/删除）

**Files:**
- Modify: `src/components/FileTree.vue`

**Test Cases:**

| ID | Source | Type | Preconditions/Input | Expected Assertions | Automation | Test Target | Command |
|---|---|---|---|---|---|---|---|
| TC-501 | Part 3 操作菜单 | normal | hover 文件节点 | 显示 `...` 按钮 | manual | 浏览器 | `npm run build` |
| TC-502 | Part 3 下载 | normal | 点击下载菜单项 | 触发 download emit | manual | 浏览器 | `npm run build` |
| TC-503 | Part 3 删除 | normal | 点击删除菜单项 | 弹出 confirm, 确认后触发 delete emit | manual | 浏览器 | `npm run build` |

- [ ] **Step 1: Update FileTree emits and state**

  在 `FileTree.vue` 的 `<script setup>` 中扩展 emits 和添加菜单状态：

  ```ts
  const emit = defineEmits<{
    (e: 'select', path: string): void
    (e: 'download', path: string): void
    (e: 'rename', path: string, newName: string): void
    (e: 'delete', path: string): void
  }>()

  const activeMenu = ref<string | null>(null)
  const renamingPath = ref<string | null>(null)
  const renameInput = ref('')

  function showMenu(path: string) { activeMenu.value = path }
  function hideMenu() { activeMenu.value = null }

  function startRename(item: TreeItem) {
    renamingPath.value = item.path
    renameInput.value = item.name
    activeMenu.value = null
  }

  function confirmRename(item: TreeItem) {
    if (renameInput.value && renameInput.value !== item.name) {
      const dir = item.path.includes('/') ? item.path.substring(0, item.path.lastIndexOf('/')) : ''
      const newPath = dir ? `${dir}/${renameInput.value}` : renameInput.value
      emit('rename', item.path, newPath)
    }
    renamingPath.value = null
  }

  function handleDelete(item: TreeItem) {
    activeMenu.value = null
    if (confirm(`确定删除 "${item.name}" 吗？`)) {
      emit('delete', item.path)
    }
  }

  function handleDownload(item: TreeItem) {
    activeMenu.value = null
    emit('download', item.path)
  }
  ```

- [ ] **Step 2: Update template — add action menu to each file item**

  在 `tree-item` 的 `@click` 之后，`item-name` 之后添加操作区域：

  ```html
  <!-- 在 <span class="item-name"> 之后，<span class="item-count"> 之前插入: -->
  <template v-if="item.type === 'file'">
    <button
      v-if="activeMenu !== item.path && renamingPath !== item.path"
      class="action-btn"
      @click.stop="showMenu(item.path)"
      title="操作"
    >···</button>
    <div v-if="activeMenu === item.path" class="action-menu" @click.stop>
      <button class="menu-item" @click="handleDownload(item)">下载</button>
      <button class="menu-item" @click="startRename(item)">重命名</button>
      <button class="menu-item danger" @click="handleDelete(item)">删除</button>
    </div>
  </template>
  ```

  替换 `item-name` 为可编辑输入（重命名模式）：
  ```html
  <!-- 替换: <span class="item-name">{{ item.name }}</span> -->
  <!-- 改为: -->
  <input
    v-if="renamingPath === item.path"
    v-model="renameInput"
    class="rename-input"
    @keyup.enter="confirmRename(item)"
    @keyup.escape="renamingPath = null"
    @blur="confirmRename(item)"
    @click.stop
    autofocus
  />
  <span v-else class="item-name">{{ item.name }}</span>
  ```

  在根元素 `<div class="file-tree">` 上添加 `@click="hideMenu"` 以点击空白处关闭菜单。

- [ ] **Step 3: Add CSS for action menu and rename input**

  ```css
  .action-btn {
    background: none; border: none; color: var(--text-quaternary);
    cursor: pointer; padding: 0 4px; font-size: 14px; letter-spacing: 1px;
    opacity: 0; transition: opacity 0.15s; flex-shrink: 0;
  }
  .tree-item:hover .action-btn { opacity: 1; }
  .action-menu {
    position: absolute; right: 8px; top: 100%; z-index: 10;
    background: var(--bg-panel); border: 1px solid var(--border-standard);
    border-radius: 6px; padding: 4px 0; min-width: 80px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  .tree-item { position: relative; }
  .menu-item {
    display: block; width: 100%; text-align: left; padding: 5px 12px;
    background: none; border: none; color: var(--text-secondary);
    font-size: 11px; cursor: pointer; font-family: var(--font-sans);
  }
  .menu-item:hover { background: var(--hover-bg); }
  .menu-item.danger { color: #ef4444; }
  .menu-item.danger:hover { background: color-mix(in srgb, #ef4444 10%, transparent); }
  .rename-input {
    flex: 1; background: var(--bg-canvas); border: 1px solid var(--accent);
    border-radius: 3px; padding: 1px 4px; font-size: 12px; color: var(--text-primary);
    font-family: var(--font-mono); outline: none; min-width: 0;
  }
  ```

- [ ] **Step 4: Build and verify**

  Run: `npm run build`
  Expected: 构建成功

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/FileTree.vue
  git commit -m "feat: add action menu (download/rename/delete) to file tree nodes"
  ```

---

## Task 6: 前端 — 上传对话框和工具栏

**Files:**
- Create: `src/components/UploadDialog.vue`
- Modify: `src/views/KbView.vue`
- Modify: `src/composables/useKnowledgeBase.ts`

**Test Cases:**

| ID | Source | Type | Preconditions/Input | Expected Assertions | Automation | Test Target | Command |
|---|---|---|---|---|---|---|---|
| TC-601 | Part 3 上传 | normal | 拖拽文件到上传区 | 文件上传成功, 树刷新 | manual | 浏览器 | `npm run build` |
| TC-602 | Part 3 新建 | normal | 点击新建文件夹, 输入名称 | 目录创建成功, 树刷新 | manual | 浏览器 | `npm run build` |

- [ ] **Step 1: Create UploadDialog.vue**

  Create `src/components/UploadDialog.vue`:

  ```vue
  <script setup lang="ts">
  import { ref, computed } from 'vue'
  import { API_BASE } from '../config/services'

  interface DirOption { path: string; name: string }

  const props = defineProps<{
    dirs: DirOption[]
    defaultDir: string
  }>()

  const emit = defineEmits<{
    (e: 'close'): void
    (e: 'uploaded'): void
  }>()

  const selectedDir = ref(props.defaultDir || 'inbox')
  const files = ref<File[]>([])
  const uploading = ref(false)
  const dragOver = ref(false)

  function onDrop(e: DragEvent) {
    e.preventDefault()
    dragOver.value = false
    if (e.dataTransfer?.files) {
      files.value = [...files.value, ...Array.from(e.dataTransfer.files)]
    }
  }

  function onFileInput(e: Event) {
    const input = e.target as HTMLInputElement
    if (input.files) {
      files.value = [...files.value, ...Array.from(input.files)]
    }
  }

  function removeFile(index: number) {
    files.value.splice(index, 1)
  }

  async function upload() {
    if (files.value.length === 0) return
    uploading.value = true
    for (const file of files.value) {
      const form = new FormData()
      form.append('file', file)
      form.append('targetDir', selectedDir.value)
      await fetch(`${API_BASE}/api/fs/upload`, { method: 'POST', body: form })
    }
    uploading.value = false
    emit('uploaded')
    emit('close')
  }
  </script>

  <template>
    <div class="dialog-overlay" @click.self="emit('close')">
      <div class="dialog">
        <div class="dialog-header">
          <span class="dialog-title">上传文件</span>
          <button class="dialog-close" @click="emit('close')">✕</button>
        </div>
        <div class="dialog-body">
          <label class="field-label">目标目录</label>
          <select v-model="selectedDir" class="dir-select">
            <option v-for="d in dirs" :key="d.path" :value="d.path">{{ d.name }}</option>
          </select>

          <div
            class="drop-zone"
            :class="{ active: dragOver }"
            @dragover.prevent="dragOver = true"
            @dragleave="dragOver = false"
            @drop="onDrop"
          >
            <p v-if="files.length === 0">拖拽文件到此处</p>
            <div v-else class="file-list">
              <div v-for="(f, i) in files" :key="i" class="file-item">
                <span class="file-name">{{ f.name }}</span>
                <span class="file-size">{{ (f.size / 1024).toFixed(1) }} KB</span>
                <button class="file-remove" @click="removeFile(i)">✕</button>
              </div>
            </div>
          </div>
          <input type="file" multiple @change="onFileInput" class="file-input" id="file-input" />
          <label for="file-input" class="file-btn">选择文件</label>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="emit('close')">取消</button>
          <button class="btn-upload" :disabled="files.length === 0 || uploading" @click="upload">
            {{ uploading ? '上传中...' : '上传' }}
          </button>
        </div>
      </div>
    </div>
  </template>

  <style scoped>
  .dialog-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
  }
  .dialog {
    background: var(--bg-panel); border: 1px solid var(--border-standard);
    border-radius: 12px; width: 480px; max-width: 90vw;
  }
  .dialog-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px; border-bottom: 1px solid var(--border-subtle);
  }
  .dialog-title { font-size: 14px; font-weight: 510; color: var(--text-primary); }
  .dialog-close { background: none; border: none; color: var(--text-quaternary); cursor: pointer; font-size: 16px; }
  .dialog-body { padding: 18px; }
  .field-label { display: block; font-size: 11px; color: var(--text-quaternary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
  .dir-select {
    width: 100%; padding: 8px 10px; border-radius: 6px;
    border: 1px solid var(--border-subtle); background: var(--bg-canvas);
    color: var(--text-primary); font-size: 13px; margin-bottom: 14px;
    font-family: var(--font-mono);
  }
  .drop-zone {
    border: 2px dashed var(--border-subtle); border-radius: 8px;
    padding: 24px; text-align: center; color: var(--text-quaternary);
    font-size: 13px; transition: border-color 0.15s; min-height: 80px;
  }
  .drop-zone.active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 5%, transparent); }
  .file-list { display: flex; flex-direction: column; gap: 6px; text-align: left; }
  .file-item {
    display: flex; align-items: center; gap: 8px; padding: 6px 8px;
    background: var(--bg-surface); border-radius: 4px;
  }
  .file-name { flex: 1; font-size: 12px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .file-size { font-size: 10px; font-family: var(--font-mono); color: var(--text-quaternary); }
  .file-remove { background: none; border: none; color: var(--text-quaternary); cursor: pointer; font-size: 12px; }
  .file-input { display: none; }
  .file-btn {
    display: inline-block; margin-top: 10px; padding: 6px 14px;
    border: 1px solid var(--border-subtle); border-radius: 6px;
    color: var(--text-secondary); font-size: 12px; cursor: pointer;
    transition: all 0.15s;
  }
  .file-btn:hover { background: var(--hover-bg); }
  .dialog-footer {
    display: flex; justify-content: flex-end; gap: 8px;
    padding: 12px 18px; border-top: 1px solid var(--border-subtle);
  }
  .btn-cancel {
    padding: 6px 16px; border-radius: 6px; border: 1px solid var(--border-subtle);
    background: none; color: var(--text-secondary); cursor: pointer; font-size: 13px;
  }
  .btn-upload {
    padding: 6px 16px; border-radius: 6px; border: none;
    background: var(--accent); color: #fff; cursor: pointer; font-size: 13px; font-weight: 510;
  }
  .btn-upload:disabled { opacity: 0.5; cursor: not-allowed; }
  </style>
  ```

- [ ] **Step 2: Add file operation methods to useKnowledgeBase.ts**

  在 `src/composables/useKnowledgeBase.ts` 中添加：

  ```ts
  async function uploadFile(file: File, targetDir: string) {
    const form = new FormData()
    form.append('file', file)
    form.append('targetDir', targetDir)
    const res = await fetch(`${API_BASE}/api/fs/upload`, { method: 'POST', body: form })
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
    return res.json()
  }

  async function createDir(path: string) {
    const res = await fetch(`${API_BASE}/api/fs/mkdir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    })
    if (!res.ok) throw new Error(`Mkdir failed: ${res.status}`)
    return res.json()
  }

  async function renamePath(oldPath: string, newPath: string) {
    const res = await fetch(`${API_BASE}/api/fs/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPath, newPath }),
    })
    if (!res.ok) throw new Error(`Rename failed: ${res.status}`)
    return res.json()
  }

  async function deletePath(path: string) {
    const res = await fetch(`${API_BASE}/api/fs/file?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
    return res.json()
  }
  ```

  更新 return 语句：
  ```ts
  return { tree, file, loading, error, fetchTree, fetchFile, uploadFile, createDir, renamePath, deletePath }
  ```

- [ ] **Step 3: Update KbView.vue — add toolbar and upload dialog**

  在 `<script setup>` 中添加：

  ```ts
  import UploadDialog from '../components/UploadDialog.vue'

  const showUpload = ref(false)
  const creatingDir = ref(false)
  const newDirName = ref('')
  const newDirParent = ref('')

  const allDirs = computed(() => {
    const dirs: { path: string; name: string }[] = []
    function walk(items: any[], prefix = '') {
      for (const item of items) {
        if (item.type === 'dir') {
          const displayPath = prefix ? `${prefix}/${item.name}` : item.name
          dirs.push({ path: item.path, name: displayPath })
          if (item.children) walk(item.children, displayPath)
        }
      }
    }
    walk(tree.value)
    return dirs
  })

  async function handleUpload() {
    showUpload.value = false
    await fetchTree()
  }

  function startCreateDir() {
    creatingDir.value = true
    newDirName.value = ''
    newDirParent.value = selectedPath.value ? selectedPath.value.split('/').slice(0, -1).join('/') || '' : ''
  }

  async function confirmCreateDir() {
    if (!newDirName.value) return
    const path = newDirParent.value ? `${newDirParent.value}/${newDirName.value}` : newDirName.value
    await createDir(path)
    creatingDir.value = false
    await fetchTree()
  }

  async function handleRename(oldPath: string, newPath: string) {
    await renamePath(oldPath, newPath)
    await fetchTree()
  }

  async function handleDelete(path: string) {
    await deletePath(path)
    if (selectedPath.value === path) {
      selectedPath.value = ''
      file.value = null
    }
    await fetchTree()
  }

  function handleDownload(path: string) {
    window.open(`${API_BASE}/api/fs/download?path=${encodeURIComponent(path)}`, '_blank')
  }
  ```

  从 composable 解构新方法：
  ```ts
  const { tree, file, loading, error, fetchTree, fetchFile, uploadFile, createDir, renamePath, deletePath } = useKnowledgeBase()
  ```

- [ ] **Step 4: Update KbView.vue template — toolbar, dialogs, file operations**

  在文件树面板 `.tree-header` 中添加工具栏按钮：
  ```html
  <div class="tree-header">
    <span class="tree-title">📁 knowledge/</span>
    <div class="tree-toolbar">
      <button class="tb-btn" @click="showUpload = true" title="上传文件">⬆</button>
      <button class="tb-btn" @click="startCreateDir" title="新建文件夹">＋</button>
      <button class="tb-btn" @click="fetchTree()" title="刷新">⟳</button>
      <button class="tree-toggle" @click="toggleTree" title="收缩面板">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
    </div>
  </div>
  ```

  在 `recent-divider` 之后，`FileTree` 之前添加新建文件夹输入：
  ```html
  <div v-if="creatingDir" class="mkdir-row">
    <input v-model="newDirName" class="mkdir-input" placeholder="文件夹名称"
      @keyup.enter="confirmCreateDir" @keyup.escape="creatingDir = false" autofocus />
    <button class="mkdir-ok" @click="confirmCreateDir">✓</button>
    <button class="mkdir-cancel" @click="creatingDir = false">✕</button>
  </div>
  ```

  更新 `FileTree` 组件添加事件监听：
  ```html
  <FileTree
    v-if="tree.length > 0"
    :items="tree"
    :selected-path="selectedPath"
    @select="handleSelect"
    @download="handleDownload"
    @rename="handleRename"
    @delete="handleDelete"
  />
  ```

  在 Markdown 面板 `.md-header` 中添加下载按钮：
  ```html
  <div class="md-header">
    <button v-if="treeCollapsed" class="tree-expand-btn" @click="toggleTree" title="展开文件树">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      <span>文件树</span>
    </button>
    <span class="md-path">{{ selectedPath || '未选择文件' }}</span>
    <button v-if="selectedPath && !file?.isBinary" class="md-download" @click="handleDownload(selectedPath)" title="下载">⬇</button>
  </div>
  ```

  在模板末尾（`</div>` 闭合 `.kb` 之前）添加上传对话框：
  ```html
  <UploadDialog
    v-if="showUpload"
    :dirs="allDirs"
    :default-dir="selectedPath ? selectedPath.split('/').slice(0, -1).join('/') || 'inbox' : 'inbox'"
    @close="showUpload = false"
    @uploaded="handleUpload"
  />
  ```

  处理非 `.md` 文件（二进制文件信息）：
  ```html
  <!-- 替换: <MarkdownViewer v-else :html="file?.content" /> -->
  <!-- 改为: -->
  <MarkdownViewer v-if="file && !file.isBinary" :html="file.content" />
  <div v-else-if="file?.isBinary" class="binary-info">
    <p class="binary-name">{{ file.name }}</p>
    <p class="binary-meta">{{ (file.size / 1024).toFixed(1) }} KB · {{ file.lastModified?.slice(0,10) }}</p>
    <button class="binary-download" @click="handleDownload(selectedPath)">下载文件</button>
  </div>
  <MarkdownViewer v-else :html="null" />
  ```

- [ ] **Step 5: Add CSS for toolbar and dialogs**

  ```css
  .tree-toolbar { display: flex; gap: 2px; margin-left: auto; }
  .tb-btn {
    background: none; border: none; color: var(--text-quaternary);
    cursor: pointer; padding: 2px 6px; font-size: 14px; border-radius: 4px;
    transition: all 0.12s;
  }
  .tb-btn:hover { background: var(--hover-bg); color: var(--text-secondary); }
  .mkdir-row { display: flex; gap: 4px; padding: 6px 16px; align-items: center; }
  .mkdir-input {
    flex: 1; background: var(--bg-canvas); border: 1px solid var(--accent);
    border-radius: 4px; padding: 4px 8px; font-size: 12px; color: var(--text-primary);
    font-family: var(--font-mono); outline: none;
  }
  .mkdir-ok, .mkdir-cancel {
    background: none; border: 1px solid var(--border-subtle); border-radius: 4px;
    color: var(--text-tertiary); cursor: pointer; padding: 4px 8px; font-size: 12px;
  }
  .mkdir-ok:hover { border-color: var(--accent); color: var(--accent); }
  .md-download {
    background: none; border: none; color: var(--text-quaternary);
    cursor: pointer; font-size: 14px; padding: 2px; margin-left: auto;
  }
  .md-download:hover { color: var(--accent); }
  .binary-info {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 8px; padding: 60px 20px; color: var(--text-tertiary);
  }
  .binary-name { font-size: 14px; font-weight: 510; }
  .binary-meta { font-size: 12px; color: var(--text-quaternary); font-family: var(--font-mono); }
  .binary-download {
    padding: 8px 20px; border-radius: 6px; border: none;
    background: var(--accent); color: #fff; cursor: pointer; font-size: 13px;
    margin-top: 8px;
  }
  ```

- [ ] **Step 6: Build and verify**

  Run: `npm run build`
  Expected: 构建成功

- [ ] **Step 7: Commit**

  ```bash
  git add src/components/UploadDialog.vue src/views/KbView.vue src/composables/useKnowledgeBase.ts
  git commit -m "feat: add upload dialog, toolbar, and file operations to Hermes KB"
  ```

---

## Task 7: 集成验证和部署

**Files:**
- Docker: rebuild and deploy

**Test Cases:**

| ID | Source | Type | Preconditions/Input | Expected Assertions | Automation | Test Target | Command |
|---|---|---|---|---|---|---|---|
| TC-701 | E2E | normal | 访问 console.ygxpro.online | 侧边栏记住折叠状态 | manual | 浏览器 | - |
| TC-702 | E2E | normal | 访问 Hermes KB | 面板收缩按钮可用 | manual | 浏览器 | - |
| TC-703 | E2E | normal | 上传文件 → 查看 → 下载 | 完整流程通过 | manual | 浏览器 | - |

- [ ] **Step 1: TypeScript check**

  Run: `npx vue-tsc --noEmit`
  Expected: 无错误

- [ ] **Step 2: Frontend build**

  Run: `npm run build`
  Expected: 构建成功

- [ ] **Step 3: Restart backend**

  ```bash
  cd /root/.hermes/projects/console-api && node server.mjs &
  ```
  等待 "Cache warm-up complete" 输出

- [ ] **Step 4: Verify backend endpoints**

  ```bash
  curl -s http://localhost:3300/api/fs/tree | head -c 200
  curl -s -F "file=@/tmp/test.txt" -F "targetDir=inbox" http://localhost:3300/api/fs/upload
  ```

- [ ] **Step 5: Rebuild Docker**

  ```bash
  cd /root/.hermes/projects && docker compose build && docker compose up -d
  ```

- [ ] **Step 6: Final verification**

  浏览器访问 `http://localhost:3200` 验证：
  1. 侧边栏折叠/展开状态刷新后保持
  2. Hermes KB 面板收缩按钮工作正常
  3. 文件上传、下载、新建文件夹、重命名、删除功能正常

- [ ] **Step 7: Commit all**

  ```bash
  git add -A
  git commit -m "feat: sidebar persistence, KB panel collapse, file management"
  ```
