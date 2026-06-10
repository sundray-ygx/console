# Console Deployment Record — 20260607 IA Redesign

## Scope

First slice of Console V2 redesign:

1. **Navigation IA restructured**: Home / Operate / Knowledge / Learn / System
2. **Pages relabeled**: "OKR" → "Projects & Goals", "PDCA" → "Reviews", "Notion 知识库" → "Resources", "Hermes 知识库" → "Wiki", "学习中心" → "Learning Center"
3. **All 8 original routes preserved** for backwards compatibility
4. **Backend /api/learn/* facade** added (dashboard, reviews/due, courses) as read-only proxy over existing /api/courses/*
5. **Learning Center now shows review count** in subtitle

## Verification

| Check | Result |
|-------|--------|
| Frontend build | PASS — `npm run build` |
| Backend syntax | PASS — `node --check server.mjs` |
| Docker deploy | PASS — rebuilt and restarted both containers |
| Local frontend | PASS — HTTP 200 |
| Public frontend | PASS — HTTP 200 |
| Public /learn route | PASS — HTTP 200 |
| Deployed bundle labels | PASS — All 12 IA labels present in bundle |
| /api/learn/dashboard | PASS — HTTP 200 |
| /api/learn/reviews/due | PASS — HTTP 200, returns `{date,total,items}` |
| /api/learn/courses | PASS — HTTP 200 |

## Files Changed

Frontend: navigation.ts, router/index.ts, OkrView.vue, PdcaView.vue, KnowledgeView.vue, KbView.vue, LearnView.vue
Backend: server.mjs (new /api/learn/facade)
