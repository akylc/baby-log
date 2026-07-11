import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * 响应式断点判断。默认 640px 以下视为移动端。
 * 用于让抽屉等组件在窄屏下自动改为全宽，避免固定像素宽度溢出视口。
 */
export function useIsMobile(breakpoint = 640) {
  const isMobile = ref(false)

  const update = () => {
    isMobile.value = typeof window !== 'undefined' && window.innerWidth <= breakpoint
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('resize', update)
    window.removeEventListener('orientationchange', update)
  })

  return { isMobile }
}

/**
 * 返回抽屉宽度：移动端全宽，桌面端使用传入的默认像素值。
 */
export function useDrawerWidth(defaultWidth = 420) {
  const { isMobile } = useIsMobile()
  return {
    isMobile,
    drawerWidth: () => (isMobile.value ? '100%' : defaultWidth),
  }
}
