# Console Deployment Record — 20260607 Review Queue

## Scope

- Added POST /api/learn/reviews/result with SM-2 algorithm
- Added outcome buttons (again/hard/good/easy) to LessonDetail
- Extended LessonProgress interface with SM-2 fields
- Passed courseId to LessonDetail for review API

## Verification

| Check | Result |
|-------|--------|
| Frontend build | PASS |
| Backend syntax | PASS |
| Docker deploy | PASS — both containers rebuilt and restarted |
| Local frontend | PASS — HTTP 200 |
| Public frontend | PASS — HTTPS 200 |
| /api/learn/reviews/result (404 case) | PASS — correct error response |
| /api/learn/reviews/due | PASS — HTTP 200 |

## Files Changed

Frontend: LessonDetail.vue, useCourses.ts, LearnView.vue
Backend: server.mjs
