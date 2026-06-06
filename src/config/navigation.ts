export const navGroups = [
  { label: '概览', items: [
    { name: '首页', icon: '🏠', path: '/' },
    { name: '今日', icon: '📋', path: '/today' },
  ]},
  { label: '工作', items: [
    { name: 'OKR', icon: '🎯', path: '/okr' },
    { name: 'PDCA', icon: '🔄', path: '/pdca' },
  ]},
  { label: '知识', items: [
    { name: 'Notion 知识库', icon: '📚', path: '/knowledge' },
    { name: 'Hermes 知识库', icon: '📖', path: '/kb' },
    { name: '学习中心', icon: '🎓', path: '/learn' },
  ]},
  { label: '', items: [
    { name: '设置', icon: '⚙', path: '/settings' },
  ]},
]