import { onMounted, onUnmounted } from 'vue'

// 仅在页面从「后台/隐藏」恢复为「前台/可见」时触发一次
const EVENT = 'app:reveal'
let installed = false
let lastFire = 0

function fire() {
  const now = Date.now()
  // 防抖：一次「回前台」可能同时命中多个事件，避免重复刷新
  if (now - lastFire < 800) return
  lastFire = now
  window.dispatchEvent(new CustomEvent(EVENT))
}

function ensureInstalled() {
  if (installed || typeof document === 'undefined') return
  installed = true
  let wasHidden = document.visibilityState === 'hidden'
  // 1) 标签页切换 / 移动端切后台（最通用）
  document.addEventListener('visibilitychange', () => {
    const hidden = document.visibilityState === 'hidden'
    if (wasHidden && !hidden) fire()
    wasHidden = hidden
  })
  // 2) 桌面端：切到别的窗口再切回（标签页仍 visible，不触发 visibilitychange）
  window.addEventListener('focus', () => fire())
  // 3) iOS PWA / bfcache：从后台返回（persisted=true 才代表「恢复」而非首次加载）
  window.addEventListener('pageshow', (e: PageTransitionEvent) => {
    if (e.persisted) fire()
  })
}

/**
 * 注册「页面从后台切回前台」时的刷新回调。
 * 回调仅在组件挂载期间生效，组件卸载时自动注销，
 * 因此天然只作用于当前停留的页面。
 */
export function useRevealRefresh(cb: () => void) {
  onMounted(() => {
    ensureInstalled()
    const handler = () => cb()
    window.addEventListener(EVENT, handler)
    onUnmounted(() => window.removeEventListener(EVENT, handler))
  })
}
