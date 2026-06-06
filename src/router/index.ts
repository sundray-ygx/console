// Task 1.1: Vue Router configuration — 8 routes
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { title: '首页', breadcrumb: [{ label: '首页', icon: '🏠' }] }
    },
    {
      path: '/today',
      name: 'today',
      component: () => import('../views/TodayView.vue'),
      meta: { title: '今日概览', breadcrumb: [{ label: '概览' }, { label: '今日', icon: '📋' }] }
    },
    {
      path: '/okr',
      name: 'okr',
      component: () => import('../views/OkrView.vue'),
      meta: { title: 'OKR 看板', breadcrumb: [{ label: '工作' }, { label: 'OKR', icon: '🎯' }] }
    },
    {
      path: '/pdca',
      name: 'pdca',
      component: () => import('../views/PdcaView.vue'),
      meta: { title: 'PDCA 看板', breadcrumb: [{ label: '工作' }, { label: 'PDCA', icon: '🔄' }] }
    },
    {
      path: '/knowledge',
      name: 'knowledge',
      component: () => import('../views/KnowledgeView.vue'),
      meta: { title: 'Notion 知识库', breadcrumb: [{ label: '知识' }, { label: 'Notion 知识库', icon: '📚' }] }
    },
    {
      path: '/kb',
      name: 'kb',
      component: () => import('../views/KbView.vue'),
      meta: { title: 'Hermes 知识库', breadcrumb: [{ label: '知识' }, { label: 'Hermes 知识库', icon: '📖' }] }
    },
    {
      path: '/learn',
      name: 'learn',
      component: () => import('../views/LearnView.vue'),
      meta: { title: '学习中心', breadcrumb: [{ label: '知识' }, { label: '学习中心', icon: '🎓' }] }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { title: '设置', breadcrumb: [{ label: '设置', icon: '⚙' }] }
    }
  ]
})

router.beforeEach((to) => {
  document.title = (to.meta.title || 'Console') + ' — ygxpro.online'
})

export default router