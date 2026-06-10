import { ref } from 'vue'
import { API_BASE } from '../config/services'

/* ── Types ── */

export interface Course {
  id: string
  area_id: string
  title: string
  description: string
  emoji: string
  source: string
  book_count: number
  material_count: number
}

export interface AreaCourseGroup {
  area_id: string
  courses: Course[]
}

export interface CourseBook {
  id: number
  title: string
  chapter: string
  sort_order: number
}

/* ── State ── */

const loading = ref(false)
const error = ref<string | null>(null)

/* ── Composable ── */

export function useAreaCourses() {
  async function fetchGroupedCourses(): Promise<AreaCourseGroup[]> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/api/courses/grouped`)
      if (!res.ok) throw new Error('Failed to fetch courses')
      const data = await res.json()
      return data.groups || []
    } catch (e: any) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchAreaCourses(areaId: string): Promise<Course[]> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/api/courses/area/${encodeURIComponent(areaId)}`)
      if (!res.ok) throw new Error('Failed to fetch area courses')
      const data = await res.json()
      return data.courses || []
    } catch (e: any) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchCourseBooks(courseId: string): Promise<CourseBook[]> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/api/courses/${encodeURIComponent(courseId)}/books`)
      if (!res.ok) throw new Error('Failed to fetch course books')
      const data = await res.json()
      return data.books || []
    } catch (e: any) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchGroupedCourses,
    fetchAreaCourses,
    fetchCourseBooks,
  }
}
