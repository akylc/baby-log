// 历史输入标签：按字段 key 把用户曾经填过的值存到 localStorage，
// 在记录页对应输入框下以可点击 tag 形式展示，点一下即可快速填入。

const PREFIX = 'ml_history_'
const MAX = 8

export function getHistory(key: string): string[] {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.map(String) : []
  } catch {
    return []
  }
}

export function pushHistory(key: string, value: string | number | null): void {
  if (value === null || value === undefined || value === '') return
  if (typeof value === 'number' && Number.isNaN(value)) return
  const v = String(value)
  const next = getHistory(key).filter((x) => x !== v)
  next.unshift(v)
  if (next.length > MAX) next.length = MAX
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(next))
  } catch {
    /* 忽略隐私模式等存储异常 */
  }
}
