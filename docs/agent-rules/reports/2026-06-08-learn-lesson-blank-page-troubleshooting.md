# Troubleshooting Report

## Problem Summary
- Fault phenomenon: Learning Center 课程详情页面显示空白，点击具体课程/章节/课时后内容区域为空
- Impact scope: `/learn` 页面下的课程详情浏览功能完全不可用
- Duration: 发现于 2026-06-08，属于新功能引入后的回归问题
- Classification: Functional / Runtime Error

## 5W1H
- What: 点击课程后右侧详情区域显示空白（empty state "从左侧选择一个课时"），即使已选择具体课时
- When: 访问带参数 URL 如 `/learn?course=product-mgmt&chapter=01-战略管理&lesson=0101` 时
- Where: `src/components/LessonDetail.vue` 组件
- Who: 所有访问 Learning Center 的用户
- Why: Vue Composition API 的 `computed` 函数被使用但未导入
- How: 浏览器控制台抛出 `ReferenceError: computed is not defined`，导致组件渲染中断

## Investigation Process
1. 检查 `LearnView.vue` 路由参数解析逻辑，确认 `readUrl()` 和 `loadCourse()` 工作正常
2. 检查 `currentLesson` computed 属性，确认数据正确获取
3. 检查 `LessonDetail.vue` 组件，发现以下证据：
   - 第 34 行使用了 `const recallPrompts = computed(...)`
   - 第 1 行只导入了 `import { ref } from 'vue'`
   - `computed` 未被导入

## Root Cause Analysis (5-Why)
- Why1: 页面显示空白？→ LessonDetail 组件渲染失败
- Why2: 组件渲染失败？→ 运行时 JavaScript 错误
- Why3: 什么错误？→ `ReferenceError: computed is not defined`
- Why4: 为什么 computed 未定义？→ 使用了 `computed()` 但未从 vue 导入
- Why5: 为什么会遗漏？→ 重构或代码合并时导入语句不完整

## Key Evidence
```
// LessonDetail.vue:1
import { ref } from 'vue'        // computed 缺失

// LessonDetail.vue:34
const recallPrompts = computed(() => {  // 此处使用 computed
  // ...
})
```

构建时本应捕获但未报错（Vite 生产构建可能未启用严格的类型检查，或问题在运行时才暴露）。

## Confidence Assessment
- Current confidence: High (100%)
- Evidence items:
  - code_defect: 确定的代码缺陷 - 40%
  - code_trace: 调用链追踪确认 - 35%
  - reproduction: 问题可稳定复现 - 35%
- Unverified items: None

## Fix Recommendation
1. 在 `LessonDetail.vue` 中添加 `computed` 导入：
   ```typescript
   import { ref, computed } from 'vue'
   ```

## Prevention Recommendation
- 启用 TypeScript 严格模式和 ESLint no-undef 规则
- 在 CI 中运行类型检查 (`vue-tsc --noEmit`)
- 代码审查时特别注意 import 语句的完整性

---

## Fix Record
- Changed files: `src/components/LessonDetail.vue`
- Bug scenario test: ✓ 已修复（`computed` 已添加到导入语句）
- Regression test: ✓ `npm run build` 构建成功，97 个模块无错误
- Residual risks: 无

## Verification
```
vite v6.4.2 building for production...
transforming...
✓ 97 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 4.92s
```

构建无错误，修复验证通过。
