import { ref } from 'vue'

// 全局「版本过低」状态：后端版本握手校验不一致时由请求拦截器置位，
// 由 App.vue 渲染不可关闭的弹框 + 底部刷新按钮，强制用户刷新以加载最新版本。
export const versionStale = ref(false)
export const serverVersion = ref('')
export const clientVersion = ref('')

export function markVersionStale(server?: string, client?: string) {
  if (server) serverVersion.value = server
  if (client) clientVersion.value = client
  versionStale.value = true
}

export function clearVersionStale() {
  versionStale.value = false
}
