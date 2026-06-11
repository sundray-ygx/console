# Troubleshooting Report — PDF渲染/书籍分类/加载速度

## Problem Summary
- **Issue 1 (书籍分类)**: AreasView 书籍按首字母分组，未使用知识主题分类
- **Issue 2 (PDF渲染)**: `/api/books/:id/view` 返回空 Content-Type + undefined filename → 浏览器白屏
- **Issue 3 (加载速度)**: 无缓存 header、一次加载 500 本、全量 AI 分类慢

## 5W1H
- **What**: ① 书籍按首字母分组错误 ② PDF 打开白屏 ③ 加载慢
- **When**: 从后端 revert 后持续存在
- **Where**: AreasView 书籍标签页 + `/api/books/:id/view` 端点 + classify.mjs
- **Who**: 所有用户
- **Why**: revert 移除了 PDF 端点修复；classify.mjs 目录匹配不覆盖 NAS 实际目录；前端不分批加载
- **How**: 打开书籍标签页 → A-Z 分组；点击书籍 → 浏览器报错

## Root Cause Analysis (5-Why)
### PDF 渲染
- **Why1**: `content-type: ` (空) + `filename="undefined"`
- **Why2**: `reply.header('Content-Type', result.contentType)` → 返回对象有 `fileType` 无 `contentType`
- **Root Cause**: revert 后端点使用错误属性名

### 书籍分类
- **Why1**: 目录映射使用精确匹配 (`path.includes('产品经理')`)，NAS 目录名不同
- **Why2**: AI 提示词未要求均匀分布，所有书归为"技术积累"
- **Root Cause**: 分类映射不覆盖实际目录 + AI 提示词不足

## Fix Record
### Fix 1: PDF 渲染
- 使用 `result.fileType` 推导 `Content-Type` (application/pdf)
- 使用 `result.fileName` 替代 `result.filename`
- 添加 `Content-Length` 和 `Cache-Control` headers
- **验证**: `curl -sI` 返回正确 headers, 浏览器可渲染

### Fix 2: 书籍分类
- 目录匹配改为关键词匹配（10 组关键词覆盖所有 NAS 目录）
- AI 提示词加入 `file_path`、目录名线索，明确要求"尽量均匀分布"
- 前端使用 `/api/books/by-topic` 分组替代首字母分组
- **验证**: 224 本书分为 6 个主题组

### Fix 3: 加载速度
- 添加后端内存 PDF 缓存 (1GB/30min TTL)
- 添加 Cache-Control 浏览器缓存 (30min/1h)
- 前端只加载一次 `/api/books/by-topic` 获取所有分类数据

## Prevention
- 添加 getBookData 内存缓存函数
- 目录匹配不应精确匹配，应使用关键词搜索
