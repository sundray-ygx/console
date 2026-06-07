// Task 1.1: Vue Router configuration — 8 routes
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { title: 'Dashboard', breadcrumb: [{ label: 'Dashboard', icon: '🏠' }] }
    },
    {
      path: '/today',
      name: 'today',
      component: () => import('../views/TodayView.vue'),
      meta: { title: 'Today', breadcrumb: [{ label: 'Home' }, { label: 'Today', icon: '📋' }] }
    },
    {
      path: '/okr',
      name: 'okr',
      component: () => import('../views/OkrView.vue'),
      meta: { title: 'Projects / Goals', breadcrumb: [{ label: 'Operate' }, { label: 'Projects / Goals', icon: '🎯' }] }
    },
    {
      path: '/pdca',
      name: 'pdca',
      component: () => import('../views/PdcaView.vue'),
      meta: { title: 'Reviews', breadcrumb: [{ label: 'Operate' }, { label: 'Reviews', icon: '🔎' }] }
    },
    {
      path: '/knowledge',
      name: 'knowledge',
      component: () => import('../views/KnowledgeView.vue'),
      meta: { title: 'Resources', breadcrumb: [{ label: 'Knowledge' }, { label: 'Resources', icon: '📚' }] }
    },
    {
      path: '/kb',
      name: 'kb',
      component: () => import('../views/KbView.vue'),
      meta: { title: 'Wiki', breadcrumb: [{ label: 'Knowledge' }, { label: 'Wiki', icon: '📖' }] }
    },
    {
      path: '/learn',
      name: 'learn',
      component: () => import('../views/LearnView.vue'),
      meta: { title: 'Learning Center', breadcrumb: [{ label: 'Learn' }, { label: 'Learning Center', icon: '🎓' }] }
    },
    {
      path: '/areas',
      name: 'areas',
      component: () => import('../views/AreasView.vue'),
      meta: { title: 'Areas', breadcrumb: [{ label: 'Knowledge' }, { label: 'Areas', icon: '📂' }] }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { title: 'Settings', breadcrumb: [{ label: 'System' }, { label: 'Settings', icon: '⚙' }] }
    }
  ]
})

router.beforeEach((to) => {
  document.title = (to.meta.title || 'Console') + ' — ygxpro.online'
})

export default router