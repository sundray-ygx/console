<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { services } from '../config/services'

const route = useRoute()
const router = useRouter()

const serviceId = computed(() => route.params.id as string)
const service = computed(() => services.find(s => s.id === serviceId.value))
const iframeUrl = computed(() => service.value?.iframeUrl || service.value?.url || '')
const canIframe = computed(() => service.value?.canIframe ?? false)

const iframeError = ref(false)
const iframeLoading = ref(true)
const iframeTimedOut = ref(false)

let timeoutHandle: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  if (!canIframe.value) {
    iframeError.value = true
    iframeLoading.value = false
    return
  }
  timeoutHandle = setTimeout(() => {
    if (iframeLoading.value) {
      iframeTimedOut.value = true
      iframeLoading.value = false
    }
  }, 5000)
})

onUnmounted(() => {
  if (timeoutHandle) clearTimeout(timeoutHandle)
})

function onIframeLoad() {
  iframeLoading.value = false
  if (timeoutHandle) clearTimeout(timeoutHandle)
}

function onIframeError() {
  iframeError.value = true
  iframeLoading.value = false
  if (timeoutHandle) clearTimeout(timeoutHandle)
}
</script>

<template>
  <div class="service-view">
    <!-- Fallback / Error -->
    <div v-if="!service" class="fallback">
      <span class="fb-icon">🔍</span>
      <h2 class="fb-title">未找到服务</h2>
      <p class="fb-desc">服务 "{{ serviceId }}" 不存在或已被移除</p>
      <button class="fb-btn" @click="router.push('/')">返回首页</button>
    </div>

    <div v-else-if="iframeError || iframeTimedOut" class="fallback">
      <span class="fb-icon">🔗</span>
      <h2 class="fb-title">{{ service.name }}</h2>
      <p class="fb-desc">
        {{ iframeTimedOut ? '连接超时，该服务可能不支持嵌入显示' : '该服务不支持 iframe 嵌入' }}
      </p>
      <p class="fb-domain">{{ service.domain }}</p>
      <a :href="service.url" target="_blank" rel="noopener" class="fb-btn primary">
        在新标签页打开
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
      </a>
      <button class="fb-btn" @click="router.push('/')">返回首页</button>
    </div>

    <!-- Iframe -->
    <template v-else>
      <div v-if="iframeLoading" class="iframe-loading">
        <div class="spinner"></div>
        <span>正在连接 {{ service.name }}...</span>
      </div>
      <iframe
        :src="iframeUrl"
        class="service-iframe"
        :class="{ hidden: iframeLoading }"
        frameborder="0"
        allowfullscreen
        @load="onIframeLoad"
        @error="onIframeError"
      ></iframe>
    </template>
  </div>
</template>

<style scoped>
.service-view {
  position: relative; width: 100%;
  height: calc(100vh - 140px); min-height: 500px;
  margin-top: 8px;
}

.service-iframe {
  width: 100%; height: 100%; border: none;
  border-radius: 12px; background: var(--bg-panel);
}
.service-iframe.hidden { opacity: 0; position: absolute; }

.iframe-loading {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; color: var(--text-quaternary); font-size: 13px;
}
.spinner {
  width: 32px; height: 32px; border: 2px solid var(--border-standard);
  border-top-color: var(--accent); border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Fallback */
.fallback {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 80px 0;
  text-align: center;
}
.fb-icon { font-size: 48px; }
.fb-title { font-size: 22px; font-weight: 510; color: var(--text-primary); }
.fb-desc { font-size: 14px; color: var(--text-tertiary); max-width: 400px; }
.fb-domain { font-size: 13px; font-family: var(--font-mono); color: var(--text-quaternary); }
.fb-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 20px; border-radius: 8px; border: 1px solid var(--border-standard);
  background: rgba(255,255,255,0.04); color: var(--text-secondary);
  font-size: 13px; cursor: pointer; transition: all 0.15s; text-decoration: none;
  font-family: var(--font-sans);
}
.fb-btn:hover { background: rgba(255,255,255,0.08); border-color: var(--border-subtle); color: var(--text-primary); }
.fb-btn.primary {
  background: rgba(113,112,255,0.1); border-color: rgba(113,112,255,0.2);
  color: var(--accent);
}
.fb-btn.primary:hover { background: rgba(113,112,255,0.15); }
</style>
