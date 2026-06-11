# 诊断报告 — Areas 书籍分类与显示问题

## Problem Summary
- **问题 1**: 课程知识主题分类下，均显示"暂无关联书籍"，但分类显示中又有书籍数目
- **问题 2**: 书籍当前仅显示总体数量，没有按 PARA 领域分类显示，无法进一步点击查看书籍内容

## 5W1H
- **What**: ① 课程详情书籍数量显示 0，点击显示"暂无关联书籍" ② 书籍分类概念与课程分类不一致
- **Where**: AreasView "课程"标签页书籍数量，"书籍"标签页分组体系
- **Why**: revert 后 SQLite course_books 表为空；AI 主题分类与 PARA 领域分类概念混淆
- **How**: 点击课程 → 从空的 SQLite 表读取；书籍标签页按 AI 主题而非 PARA 领域分组

## Root Cause Analysis (5-Why)

### 问题 1: 课程详情显示"暂无关联书籍"
```
Why1: 课程展开后显示"暂无关联书籍"
Why2: /api/courses/:id/books 返回空数组
Why3: getCourseBooks() 从 SQLite course_books 表查询
Why4: 书籍索引重建后没有建立课程-书籍关联
Why5: revert 丢失了课程书籍关联初始化逻辑，SQLite course_books 表始终为空
```
**Root Cause**: 课程书籍从空的 SQLite course_books 表读取，但实际应该按目录/关键词自动匹配

### 问题 2: 书籍按 PARA 领域分类显示
```
Why1: 用户说"没有分类显示"
Why2: 书籍按 AI 主题分组（技术积累/经济理财...），但 CSS class 名是 letter-key
Why3: 没有和课程一样按 PARA 领域（产品经理/团队管理/技术积累...）分组
Why4: 书籍和课程使用两套不同的分类体系
Why5: 设计概念混淆：PARA 领域（Area） vs AI 知识主题（Topic）
```
**Root Cause**: 书籍分组体系与课程分组体系不一致，用户期待两者统一

## Fix Plan
1. **修复 `/api/courses/:id/books`**: 改为从书籍索引按标题/关键词匹配，不依赖 SQLite
2. **修复书籍标签页分组**: 按 PARA 领域分类，与课程标签保持一致
3. **确保书籍可点击打开 PDF**: 确认 CourseReader 正确加载

## Prevention
- 课程书籍关联应避免依赖人工维护的数据库关系
- 设计时统一领域和主题的概念边界
- 提交前使用真实数据验证，不要依赖模拟数据
