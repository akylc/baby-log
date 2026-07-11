import { ref } from 'vue'

const KEY = 'ml-dark'

const prefersDark =
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia('(prefers-color-scheme: dark)').matches

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null
export const isDark = ref(stored !== null ? stored === '1' : !!prefersDark)

export function applyTheme() {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', isDark.value)
}

export function toggleTheme() {
  isDark.value = !isDark.value
  try {
    localStorage.setItem(KEY, isDark.value ? '1' : '0')
  } catch {
    /* 忽略隐私模式等存储异常 */
  }
  applyTheme()
}

// 首次加载即应用一次（保证刷新后保持用户选择 / 系统偏好）
applyTheme()
