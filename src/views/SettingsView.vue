<script setup lang="ts">
import { ref } from 'vue'

const settings = ref([
  { id: 1, name: '深色模式', desc: '始终使用深色主题', icon: '🌙', enabled: true },
  { id: 2, name: '自动刷新', desc: '每 10 秒自动更新系统状态', icon: '🔄', enabled: true },
  { id: 3, name: '服务健康检查', desc: '实时检测服务在线状态', icon: '💓', enabled: true },
  { id: 4, name: '侧栏展开', desc: '默认展开侧栏导航', icon: '📐', enabled: true },
  { id: 5, name: '通知提醒', desc: '服务离线时发送通知', icon: '🔔', enabled: false },
  { id: 6, name: '数据缓存', desc: '缓存 API 响应以加速加载', icon: '💾', enabled: false },
])
</script>

<template>
  <div class="settings">
    <h1 class="page-title">设置</h1>
    <p class="page-subtitle">个性化配置 · 即将推出更多选项</p>

    <div class="settings-grid">
      <div v-for="setting in settings" :key="setting.id" class="setting-card">
        <div class="setting-left">
          <span class="setting-icon">{{ setting.icon }}</span>
          <div class="setting-info">
            <span class="setting-name">{{ setting.name }}</span>
            <span class="setting-desc">{{ setting.desc }}</span>
          </div>
        </div>
        <label class="toggle">
          <input type="checkbox" v-model="setting.enabled" />
          <span class="toggle-track" :class="{ on: setting.enabled }">
            <span class="toggle-thumb"></span>
          </span>
        </label>
      </div>
    </div>

    <div class="coming-soon">
      <span class="cs-icon">🚀</span>
      <h2 class="cs-title">更多功能即将推出</h2>
      <p class="cs-desc">用户配置同步、自定义主题色、快捷键设置、数据导出等功能正在开发中</p>
    </div>

    <div class="about">
      <div class="about-row">
        <span class="about-label">版本</span>
        <span class="about-value">v0.2.0-beta</span>
      </div>
      <div class="about-row">
        <span class="about-label">构建</span>
        <span class="about-value">Vue 3.5 + Vue Router 4 + TypeScript</span>
      </div>
      <div class="about-row">
        <span class="about-label">作者</span>
        <span class="about-value">ygxpro.online</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings { padding-top: 32px; }
.page-title { font-size: 28px; font-weight: 510; letter-spacing: -0.6px; color: var(--text-primary); margin-bottom: 4px; }
.page-subtitle { font-size: 14px; color: var(--text-tertiary); margin-bottom: 28px; }

.settings-grid { display: flex; flex-direction: column; gap: 6px; margin-bottom: 32px; }

.setting-card {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; background: rgba(255,255,255,0.02);
  border: 1px solid var(--border-subtle); border-radius: 10px;
  transition: background 0.15s;
}
.setting-card:hover { background: rgba(255,255,255,0.03); }

.setting-left { display: flex; align-items: center; gap: 12px; }
.setting-icon { font-size: 20px; }
.setting-info { display: flex; flex-direction: column; }
.setting-name { font-size: 14px; font-weight: 510; color: var(--text-primary); }
.setting-desc { font-size: 12px; color: var(--text-quaternary); }

/* Toggle */
.toggle { cursor: pointer; }
.toggle input { display: none; }
.toggle-track {
  width: 36px; height: 20px; display: block; border-radius: 10px;
  background: rgba(255,255,255,0.08); position: relative;
  transition: background 0.2s;
}
.toggle-track.on { background: rgba(113,112,255,0.4); }
.toggle-thumb {
  position: absolute; top: 2px; left: 2px;
  width: 16px; height: 16px; border-radius: 50%;
  background: var(--text-quaternary); transition: all 0.2s;
}
.toggle-track.on .toggle-thumb { left: 18px; background: var(--accent); }

/* Coming Soon */
.coming-soon {
  text-align: center; padding: 40px 20px;
  background: rgba(255,255,255,0.015); border: 1px dashed var(--border-standard);
  border-radius: 12px; margin-bottom: 32px;
}
.cs-icon { font-size: 36px; display: block; margin-bottom: 12px; }
.cs-title { font-size: 16px; font-weight: 510; color: var(--text-secondary); margin-bottom: 6px; }
.cs-desc { font-size: 13px; color: var(--text-quaternary); line-height: 1.6; }

/* About */
.about {
  background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle);
  border-radius: 12px; padding: 16px 20px;
}
.about-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; border-bottom: 1px solid var(--border-subtle);
}
.about-row:last-child { border-bottom: none; }
.about-label { font-size: 12px; color: var(--text-quaternary); }
.about-value { font-size: 12px; font-family: var(--font-mono); color: var(--text-tertiary); }
</style>
