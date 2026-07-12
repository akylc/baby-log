import { onMounted, onUnmounted, onActivated, onDeactivated } from 'vue'

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
 * - 普通组件：挂载时生效、卸载时注销（只作用于当前停留页面）。
 * - keep-alive 组件：不卸载，只在激活/失活间切换，因此监听在
 *   激活时挂载、失活时注销，确保只刷新「当前停留」的页面，
 *   不会让所有被缓存页面在回前台时一起刷新。
 */
export function useRevealRefresh(cb: () => void) {
  const handler = () => cb()
  const add = () => {
    ensureInstalled()
    window.addEventListener(EVENT, handler)
  }
  const remove = () => window.removeEventListener(EVENT, handler)
  // 同引用重复 add/remove 幂等，避免首次挂载 onMounted+onActivated 双注册
  onMounted(add)
  onUnmounted(remove)
  onActivated(add)
  onDeactivated(remove)
}
