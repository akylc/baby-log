export type RecType =
  | 'breast'
  | 'formula'
  | 'food'
  | 'bottle'
  | 'supplement'
  | 'sleep'
  | 'play'
  | 'diaper'
  | 'bath'
  | 'haircut'
  | 'nails'

export interface RecordTypeOption {
  value: RecType
  label: string
  icon: string
}

// 统一的记录类型列表：首页扇形菜单与添加记录页共用，确保排序一致；改此处两处自动同步
export const RECORD_TYPES: RecordTypeOption[] = [
  { value: 'breast', label: '母乳', icon: '🤱' },
  { value: 'formula', label: '配方奶', icon: '🥛' },
  { value: 'bottle', label: '瓶喂母乳', icon: '🍼' },
  { value: 'food', label: '辅食', icon: '🍚' },
  { value: 'supplement', label: '营养补剂', icon: '💊' },
  { value: 'sleep', label: '睡眠', icon: '😴' },
  { value: 'play', label: '娱乐', icon: '🎡' },
  { value: 'diaper', label: '换尿布', icon: '💩' },
  { value: 'bath', label: '洗澡', icon: '🛁' },
  { value: 'haircut', label: '理发', icon: '💇' },
  { value: 'nails', label: '剪指甲', icon: '✂️' },
]

// 仅 value 的字符串数组（用于筛选校验等场景）
export const RECORD_TYPE_VALUES = RECORD_TYPES.map((t) => t.value)

// 用户在添加记录页拖拽自定义的类型顺序，持久化于 localStorage。
// 首页扇形菜单与添加记录页扇形共用同一份顺序，确保两处排序始终一致。
export const TYPE_ORDER_KEY = 'ml_type_order'

// 读取用户自定义类型顺序；无效/缺失时回退到 RECORD_TYPE_VALUES（即 RECORD_TYPES 的顺序）
export function loadTypeOrder(): RecType[] {
  try {
    const raw = localStorage.getItem(TYPE_ORDER_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (
        Array.isArray(arr) &&
        arr.length === RECORD_TYPE_VALUES.length &&
        arr.every((v) => RECORD_TYPE_VALUES.includes(v))
      ) {
        return arr as RecType[]
      }
    }
  } catch {
    /* 忽略存储异常 */
  }
  return RECORD_TYPE_VALUES.slice() as RecType[]
}

export function saveTypeOrder(order: RecType[]): void {
  try {
    localStorage.setItem(TYPE_ORDER_KEY, JSON.stringify(order))
  } catch {
    /* 忽略存储异常 */
  }
}

// 将顺序数组映射回带 label/icon 的选项列表（过滤掉未知的 value）
export function orderedRecordTypes(order: RecType[]): RecordTypeOption[] {
  return order.map((v) => RECORD_TYPES.find((t) => t.value === v)!).filter(Boolean)
}
