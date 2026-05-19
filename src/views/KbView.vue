<script setup lang="ts">
import { ref, computed } from 'vue'

interface TreeNode {
  name: string; type: 'file' | 'dir'; children?: TreeNode[]
  content?: string
}

const fileTree: TreeNode[] = [
  {
    name: 'knowledge', type: 'dir', children: [
      {
        name: 'dev', type: 'dir', children: [
          { name: 'docker.md', type: 'file', content: '# Docker 备忘录\n\n## 常用命令\n\n```bash\n# 构建镜像\ndocker build -t myapp .\n\n# 运行容器\ndocker run -d -p 8080:80 --name myapp myapp\n\n# 查看日志\ndocker logs -f myapp\n\n# 进入容器\ndocker exec -it myapp /bin/sh\n```\n\n## Docker Compose\n\n```yaml\nversion: "3.8"\nservices:\n  web:\n    image: nginx:alpine\n    ports:\n      - "80:80"\n    volumes:\n      - ./nginx.conf:/etc/nginx/nginx.conf\n```\n\n## 清理资源\n\n```bash\ndocker system prune -a --volumes\n```\n' },
          { name: 'git.md', type: 'file', content: '# Git 高级技巧\n\n## 交互式 Rebase\n\n```bash\ngit rebase -i HEAD~5\n```\n\n## Cherry Pick\n\n```bash\ngit cherry-pick abc123\n```\n\n## Stash 管理\n\n```bash\ngit stash list\ngit stash pop\ngit stash apply stash@{2}\n```\n\n## 修改历史提交\n\n```bash\ngit commit --amend\ngit rebase -i HEAD~3\n```\n' },
          { name: 'linux.md', type: 'file', content: '# Linux 服务器管理\n\n## 系统信息\n\n```bash\nuname -a\nfree -h\ndf -h\ntop\n```\n\n## 防火墙 (UFW)\n\n```bash\nufw allow 80/tcp\nufw allow 443/tcp\nufw enable\nufw status\n```\n\n## Systemd 服务\n\n```bash\nsystemctl start service\nsystemctl enable service\njournalctl -u service -f\n```\n' },
          { name: 'nginx.md', type: 'file', content: '# Nginx 配置\n\n## 反向代理\n\n```nginx\nserver {\n  listen 80;\n  server_name app.example.com;\n  location / {\n    proxy_pass http://127.0.0.1:3000;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n  }\n}\n```\n\n## SSL 配置\n\n```nginx\nserver {\n  listen 443 ssl http2;\n  ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;\n  ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;\n}\n```\n' },
        ]
      },
      {
        name: 'programming', type: 'dir', children: [
          { name: 'typescript.md', type: 'file', content: '# TypeScript 笔记\n\n## 泛型工具类型\n\n```typescript\ntype Partial<T> = { [P in keyof T]?: T[P] }\ntype Required<T> = { [P in keyof T]-?: T[P] }\ntype Pick<T, K extends keyof T> = { [P in K]: T[P] }\ntype Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>\n```\n\n## 条件类型\n\n```typescript\ntype IsString<T> = T extends string ? true : false\ntype Extract<T, U> = T extends U ? T : never\n```\n' },
          { name: 'vue3.md', type: 'file', content: '# Vue 3 核心\n\n## Composition API\n\n```typescript\nimport { ref, computed, onMounted } from "vue"\n\nconst count = ref(0)\nconst doubled = computed(() => count.value * 2)\n\nonMounted(() => {\n  console.log("mounted")\n})\n```\n\n## Provide/Inject\n\n```typescript\n// Parent\nprovide("theme", ref("dark"))\n\n// Child\nconst theme = inject("theme")\n```\n' },
          { name: 'rust.md', type: 'file', content: '# Rust 入门\n\n## 所有权规则\n\n- 每个值只有一个所有者\n- 值离开作用域时自动释放\n- 赋值会转移所有权\n\n```rust\nfn main() {\n  let s1 = String::from("hello");\n  let s2 = s1; // s1 移动到 s2\n  // println!("{}", s1); // 编译错误\n  println!("{}", s2);\n}\n```\n' },
        ]
      },
      {
        name: 'self', type: 'dir', children: [
          { name: 'reading.md', type: 'file', content: '# 2026 读书清单\n\n## 已读\n- ✅ 《系统设计面试》— 系统架构思维\n- ✅ 《原子习惯》— 习惯养成方法论\n- ✅ 《深度工作》— 专注力管理\n\n## 在读\n- 📖 《Designing Data-Intensive Applications》\n- 📖 《Rust 程序设计》\n\n## 待读\n- 📋 《凤凰项目》\n- 📋 《重构》\n' },
          { name: 'habits.md', type: 'file', content: '# 习惯追踪方法论\n\n## 核心原则\n\n1. **两分钟规则**：新习惯缩减到 2 分钟以内\n2. **习惯叠加**：新习惯绑定已有习惯之后\n3. **环境设计**：让好习惯触手可及\n\n## 当前习惯清单\n\n| 习惯 | 时间 | 状态 |\n|------|------|------|\n| 冥想 | 7:00 | ✅ |\n| 阅读 | 8:00 | ✅ |\n| 运动 | 18:00 | ⏳ |\n' },
        ]
      },
      { name: 'README.md', type: 'file', content: '# 知识库\n\n这是 Hermes 个人知识库，包含以下分类：\n\n- `dev/` — 开发运维相关笔记\n- `programming/` — 编程语言与框架笔记\n- `self/` — 个人成长与生活管理\n\n> 知识只有被记录下来，才能真正属于你。\n' },
    ]
  }
]

const expandedDirs = ref<Set<string>>(new Set(['knowledge', 'knowledge/dev']))
const selectedFile = ref<string>('knowledge/README.md')

function toggleDir(path: string) {
  const s = new Set(expandedDirs.value)
  if (s.has(path)) s.delete(path); else s.add(path)
  expandedDirs.value = s
}

function findNode(path: string, nodes: TreeNode[], prefix: string = ''): TreeNode | null {
  for (const n of nodes) {
    const full = prefix ? `${prefix}/${n.name}` : n.name
    if (full === path) return n
    if (n.children) {
      const found = findNode(path, n.children, full)
      if (found) return found
    }
  }
  return null
}

const currentNode = computed(() => findNode(selectedFile.value, fileTree))

function renderTree(nodes: TreeNode[], prefix: string = '', depth: number = 0): { path: string; node: TreeNode; depth: number }[] {
  const result: { path: string; node: TreeNode; depth: number }[] = []
  for (const n of nodes) {
    const full = prefix ? `${prefix}/${n.name}` : n.name
    result.push({ path: full, node: n, depth })
    if (n.type === 'dir' && expandedDirs.value.has(full) && n.children) {
      result.push(...renderTree(n.children, full, depth + 1))
    }
  }
  return result
}

const flatTree = computed(() => renderTree(fileTree))
</script>

<template>
  <div class="kb">
    <h1 class="page-title">Hermes 知识库</h1>
    <p class="page-subtitle">本地知识文件浏览器</p>

    <div class="kb-layout">
      <!-- Left: File Tree -->
      <div class="tree-panel">
        <div class="tree-header">
          <span class="tree-title">📁 knowledge/</span>
        </div>
        <div class="tree-list">
          <div v-for="item in flatTree" :key="item.path"
            class="file-item"
            :class="{ active: selectedFile === item.path, dir: item.node.type === 'dir' }"
            :style="{ paddingLeft: (12 + item.depth * 16) + 'px' }"
            @click="item.node.type === 'dir' ? toggleDir(item.path) : selectedFile = item.path"
          >
            <svg v-if="item.node.type === 'dir'" class="dir-arrow" :class="{ expanded: expandedDirs.has(item.path) }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            <span class="file-icon">{{ item.node.type === 'dir' ? (expandedDirs.has(item.path) ? '📂' : '📁') : '📄' }}</span>
            <span class="file-name">{{ item.node.name }}</span>
          </div>
        </div>
      </div>

      <!-- Right: Markdown Viewer -->
      <div class="md-panel">
        <div class="md-header">
          <span class="md-path">{{ selectedFile }}</span>
        </div>
        <div class="md-content" v-if="currentNode?.content">
          <pre class="md-pre">{{ currentNode.content }}</pre>
        </div>
        <div class="md-empty" v-else>
          <span class="empty-icon">📄</span>
          <p>选择一个文件查看内容</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kb { padding-top: 32px; }
.page-title { font-size: 28px; font-weight: 510; letter-spacing: -0.6px; color: var(--text-primary); margin-bottom: 4px; }
.page-subtitle { font-size: 14px; color: var(--text-tertiary); margin-bottom: 24px; }

.kb-layout { display: grid; grid-template-columns: 260px 1fr; gap: 16px; height: calc(100vh - 200px); min-height: 400px; }

/* Tree */
.tree-panel { background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; }
.tree-header { padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); }
.tree-title { font-size: 12px; font-weight: 510; color: var(--text-tertiary); font-family: var(--font-mono); }
.tree-list { flex: 1; overflow-y: auto; padding: 8px 0; }

.file-item {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 12px; cursor: pointer; font-size: 12px;
  color: var(--text-tertiary); transition: all 0.12s;
}
.file-item:hover { background: rgba(255,255,255,0.04); color: var(--text-secondary); }
.file-item.active { background: rgba(113,112,255,0.08); color: var(--accent); }
.dir-arrow { color: var(--text-quaternary); transition: transform 0.15s; flex-shrink: 0; }
.dir-arrow.expanded { transform: rotate(90deg); }
.file-icon { font-size: 14px; flex-shrink: 0; }
.file-name { font-family: var(--font-mono); }

/* Markdown */
.md-panel { background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; }
.md-header { padding: 10px 16px; border-bottom: 1px solid var(--border-subtle); }
.md-path { font-size: 11px; font-family: var(--font-mono); color: var(--text-quaternary); }
.md-content { flex: 1; overflow-y: auto; padding: 20px; }
.md-pre {
  font-family: var(--font-mono); font-size: 13px; line-height: 1.7;
  color: var(--text-secondary); white-space: pre-wrap; word-wrap: break-word;
}
.md-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--text-quaternary); }
.empty-icon { font-size: 32px; }

@media (max-width: 768px) {
  .kb-layout { grid-template-columns: 1fr; height: auto; }
  .tree-panel { max-height: 250px; }
}
</style>
