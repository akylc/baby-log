import { ref, computed } from 'vue'

const MODE_KEY = 'ml-theme-mode' // 'system' | 'light' | 'dark'

const media =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null

// 系统当前是否偏好深色
const systemDark = ref(media ? media.matches : false)
if (media) {
  const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
    systemDark.value = e.matches
    if (mode.value === 'system') applyTheme()
  }
  if (typeof media.addEventListener === 'function') media.addEventListener('change', onChange)
  else if (typeof media.addListener === 'function') media.addListener(onChange)
}

// 主题模式：默认跟随系统；用户手动选择后固定为 light/dark
const storedMode =
  typeof localStorage !== 'undefined' ? localStorage.getItem(MODE_KEY) : null
export const mode = ref<'system' | 'light' | 'dark'>(
  storedMode === 'light' || storedMode === 'dark' || storedMode === 'system'
    ? (storedMode as 'system' | 'light' | 'dark')
    : 'system'
)

export const isDark = computed(() =>
  mode.value === 'system' ? systemDark.value : mode.value === 'dark'
)

export function applyTheme() {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', isDark.value)
}

export function setThemeMode(m: 'system' | 'light' | 'dark') {
  mode.value = m
  try {
    localStorage.setItem(MODE_KEY, m)
  } catch {
    /* 忽略隐私模式等存储异常 */
  }
  applyTheme()
}

// 首次加载即应用一次（保证刷新后保持用户选择 / 系统偏好）
applyTheme()
