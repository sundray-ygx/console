import { ref } from 'vue'
import { API_BASE } from '../config/services'

/* ── Types ── */

export interface CourseSummary {
  id: string
  title: string
  emoji?: string
  cover_emoji?: string
  description: string
  material_count: number
  chapter_count: number
  difficulty_range: string
  estimated_hours: number
  tags?: string[]
}

export interface Catalog {
  version: string
  last_updated: string
  total_courses: number
  total_materials: number
  courses: CourseSummary[]
}

export interface LessonMaterial {
  notion_id: string
  title: string
  url: string
  relation?: string
  key_points?: string[]
}

export interface CodeExample {
  language: string
  title: string
  code: string
}

export interface Exercise {
  question: string
  hint?: string
  answer: string
}

export interface Lesson {
  lesson_id: string
  title: string
  type: string // 概念 | 实操 | 案例 | 工具
  level: string // L1 | L2 | L3
  summary: string
  tags?: string[]
  materials: LessonMaterial[]
  key_notes?: string
  deep_content?: string
  code_examples?: CodeExample[]
  exercises?: Exercise[]
}

export interface Chapter {
  chapter_id: string
  title: string
  tag?: string
  level: string
  lesson_count?: number
  objectives?: string[]
  lessons: Lesson[]
}

export interface ChapterMeta {
  id: string
  title: string
  level: string
  lesson_count?: number
}

export interface CourseMeta extends CourseSummary {
  notion_category?: string[]
  created_at: string
  chapters: ChapterMeta[]
}

export interface LessonProgress {
  status: 'unread' | 'reading' | 'read' | 'review' | 'favorite'
  last_read: string
  read_count?: number
  review_due?: string
  next_review?: string
  ease_factor?: number
  interval_days?: number
  repetitions?: number
  lapses?: number
  last_outcome?: string
}

export interface Progress {
  course_id: string
  lessons: Record<string, LessonProgress>
  last_position: { chapter: string; lesson: string } | null
  started_at: string | null
  last_updated?: string
}

export interface CourseFull extends CourseMeta {
  chapters: Chapter[] // full content
  progress: Progress | null
}

export interface DashboardCourseProgress {
  id: string
  title: string
  cover_emoji?: string
  total_lessons: number
  read_lessons: number
  percent: number
  last_read: string | null
}

export interface Dashboard {
  total_courses: number
  total_materials: number
  total_lessons: number
  total_read: number
  total_favorited: number
  overall_percent: number
  courses_progress: DashboardCourseProgress[]
}

export interface ReviewDueItem {
  course_id: string
  course_title: string
  course_emoji: string
  lesson_id: string
  lesson_title: string
  chapter_id: string
  review_due: string
  review_count: number
  days_overdue: number
}

export interface ReviewDue {
  date: string
  total: number
  items: ReviewDueItem[]
}

/* ── Composable ── */

export function useCourses() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchJson<T>(url: string, options?: RequestInit): Promise<T | null> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}${url}`, options)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      return await res.json()
    } catch (e: any) {
      error.value = e.message
      return null
    } finally {
      loading.value = false
    }
  }

  async function postJson<T>(url: string, body: any): Promise<T | null> {
    return fetchJson<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  function fetchCatalog() {
    return fetchJson<Catalog>('/api/courses/catalog')
  }

  function fetchDashboard() {
    return fetchJson<Dashboard>('/api/courses/dashboard')
  }

  function fetchReviewDue() {
    return fetchJson<ReviewDue>('/api/courses/review-due')
  }

  function fetchCourse(id: string) {
    return fetchJson<CourseFull>(`/api/courses/${encodeURIComponent(id)}`)
  }

  function fetchChapter(id: string, cid: string) {
    return fetchJson<Chapter>(`/api/courses/${encodeURIComponent(id)}/chapter/${encodeURIComponent(cid)}`)
  }

  function fetchProgress(id: string) {
    return fetchJson<Progress>(`/api/courses/${encodeURIComponent(id)}/progress`)
  }

  function updateProgress(id: string, lesson_id: string, status: LessonProgress['status']) {
    return postJson<Progress>(`/api/courses/${encodeURIComponent(id)}/progress`, { lesson_id, status })
  }

  return {
    loading,
    error,
    fetchCatalog,
    fetchDashboard,
    fetchReviewDue,
    fetchCourse,
    fetchChapter,
    fetchProgress,
    updateProgress,
  }
}
