# Console Deployment Record — 20260607 PDCA LLM Redesign

## Scope

1. PDCA layout changed to top/bottom sections:
   - Plan section on top
   - Review section below
   - Week / Month / Quarter shown as three columns inside each section
2. Fixed Notion rich_text extraction:
   - `getRichText()` now joins all rich_text blocks instead of returning only the first block
   - This fixes truncated `周计划` / `月计划` / `季度计划` values such as only showing `【综合管理】`
3. Switched month/quarter review generation to Plan B:
   - `console-api` calls the local model proxy through `MODEL_PROXY_URL`
   - Month and quarter review summaries are LLM-generated markdown
   - Falls back to rule-based markdown if the LLM call fails
4. Deployment support:
   - `console-api` Docker Compose config now maps `host.docker.internal` to the host gateway
   - Model proxy now supports `PROXY_HOST`; shell autostart uses `PROXY_HOST=0.0.0.0`

## Verification

| Check | Result |
|-------|--------|
| Frontend build | PASS — `npm run build` |
| API syntax | PASS — `node --check server.mjs` |
| Docker deploy | PASS — rebuilt and restarted `console-api` and `console` |
| Model proxy from container | PASS — `wget http://host.docker.internal:3456/health` returned `OK` |
| PDCA API plan extraction | PASS — month plan length 682, quarter plan length 536 |
| PDCA LLM summary | PASS — month/quarter `llm=true`, markdown headings present |
| Local frontend | PASS — HTTP 200 |
| Public frontend | PASS — HTTP 200 |
| Public `/pdca` route | PASS — HTTP 200 |
| Public PDCA API | PASS — month/quarter plan and LLM markdown returned |

## Notes

The first uncached PDCA request can take tens of seconds while month and quarter summaries are generated. Subsequent requests are served from the in-memory LLM cache and return quickly.
