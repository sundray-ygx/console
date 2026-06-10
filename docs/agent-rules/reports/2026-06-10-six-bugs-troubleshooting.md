# Troubleshooting Report — 6 Areas/Learning Bugs

## Issue 1: PDF.js "Cannot read from private field"

**Root Cause:** pdfjs-dist v3.11.174 uses ES private class fields. CDN worker URL + ESM bundled library = class mismatch.

## Issue 2: Course link → Learning Center 404

**Root Cause:** AreasView links courses to `/learn?course=course-pm-basics`, but LearnView loads from JSON catalog in `/root/.hermes/courses/`. SQLite course IDs don't exist there.

## Issue 3: CourseTree no collapse

**Root Cause:** `handleCourseClick` calls `expandedCourses.value.add(id)` without checking if already expanded.

## Issue 4: Notion knowledge empty titles + no response

**Root Cause:** `notion.getTitle(page, '书名')` should be `notion.getTitle(page, '标题')` or `notion.getTitle(page, '书')`. Items not limited. No click handler.

## Issue 5: Course book count wrong + no content

**Root Cause:** `getCourseBooks` does `JOIN books_index ON book_id = id`. If DB was reset, course_books IDs don't match re-indexed IDs.

## Issue 6: Books limited to 50 + no categories

**Root Cause:** `getRecentBooks(50)` hard-coded parameter. No grouping.
