import { ref } from 'vue'

const STORAGE_KEY = 'ml-grouped-view'

// 默认开：未设置或值为 '1' 时为分组视图；仅当显式存 '0' 时关闭。
// 模块级单例 ref，Baby.vue（开关）与 Home.vue（渲染）共享同一状态。
const groupedView = ref(localStorage.getItem(STORAGE_KEY) !== '0')

export function useGroupedView() {
  function setGroupedView(v: boolean) {
    groupedView.value = v
    try {
      localStorage.setItem(STORAGE_KEY, v ? '1' : '0')
    } catch {
      // 隐私模式等存储异常时静默忽略，仅内存态生效
    }
  }
  return { groupedView, setGroupedView }
}
