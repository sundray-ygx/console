# Troubleshooting Report — PDF渲染/书籍分类/加载速度

## Problem Summary
- **Issue 1 (书籍分类)**: AreasView 书籍标签页按首字母分组，分类错误，未使用知识主题
- **Issue 2 (PDF渲染)**: `/api/books/:id/view` 端点响应头错误导致 PDF 无法渲染
- **Issue 3 (加载速度)**: PDF 无缓存、无 Content-Length、浏览器无缓存策略

## 5W1H
- **What**: ① 书籍按首字母分组不反映知识主题 ② PDF 打开后白屏 ③ 书籍加载慢
- **When**: 从 revert 后持续存在
- **Where**: AreasView 书籍标签页 + `/api/books/:id/view` 端点
- **Who**: 所有用户
- **Why**: revert 后 `/api/books/:id/view` 使用了未定义属性 `result.contentType` 和 `result.filename`；分类仅按首字母
- **How**: 打开书籍标签页 → 书籍按 A-Z 字母分组；点击书籍 → PDF viewer 接收空 Content-Type

## Root Cause Analysis (5-Why)
### PDF 渲染
- **Why1**: PDF viewer 白屏 → 浏览器收到空 Content-Type
- **Why2**: `/api/books/:id/view` 返回 `content-type: `（空）
- **Why3**: `reply.header('Content-Type', result.contentType)` → `getBookStream` 返回 `fileType` 而非 `contentType`
- **Why4**: revert 移除了已修复的端点代码，重新使用了错误的属性名
- **Root Cause**: 后端 revert 后 `/api/books/:id/view` 未正确重建

### 书籍分类
- **Why1**: 书籍按首字母 A-Z 分组
- **Why2**: `sortedBookGroups` computed property 使用 `book.title[0]` 分组
- **Why3**: 虽然有 `/api/books/by-topic` API，但 AreasView 未正确使用
- **Root Cause**: 前端未集成 AI 分类结果到书籍分组展示

## Key Evidence
```
$ curl -sI http://localhost:3300/api/books/10071/view
HTTP/1.1 200 OK
content-type:                          ← 空！
content-disposition: inline; filename="undefined"  ← undefined！
Content-Length: 缺失                    ← 无缓存
```

## Fix Plan
1. **Fix `/api/books/:id/view`**: 使用 `result.fileType` 推导 Content-Type，使用 `result.fileName`，添加 Content-Length 和 Cache-Control
2. **Fix 书籍分类**: AreasView 使用 `/api/books/by-topic` 替代首字母分组
3. **优化加载速度**: 添加浏览器缓存、PDF 流式加载
