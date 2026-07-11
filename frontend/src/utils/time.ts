export function formatTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// DatePicker(毫秒时间戳) -> 本地时区 ISO 字符串
export function tsToIso(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// ISO 字符串 -> 毫秒时间戳（用于 DatePicker 回填）
export function isoToTs(iso: string): number {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? Date.now() : d.getTime()
}
