import { db } from './db'

// 取当前用户的宝宝（单宝宝）。传入 babyId 时校验归属。
export function getBabyByUser(uid: number, babyId?: number): any | null {
  if (babyId) {
    return db.prepare('SELECT * FROM babies WHERE id=? AND user_id=?').get(babyId, uid)
  }
  return db.prepare('SELECT * FROM babies WHERE user_id=?').get(uid)
}

const pad = (n: number) => String(n).padStart(2, '0')

// 本地时间字符串：YYYY-MM-DD HH:MM:SS（与前端 tsToIso 保持一致，便于字符串比较）
export function fmtLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function localNow(): string {
  return fmtLocal(new Date())
}

// 给定日期(YYYY-MM-DD 或 Date)返回当天 [start, end) 本地时间字符串
export function dateRange(date?: string): { start: string; end: string } {
  const base = date ? new Date(date) : new Date()
  const y = base.getFullYear()
  const m = base.getMonth()
  const d = base.getDate()
  const start = new Date(y, m, d, 0, 0, 0, 0)
  const end = new Date(y, m, d + 1, 0, 0, 0, 0)
  return { start: fmtLocal(start), end: fmtLocal(end) }
}

// 数字或 null（空值统一存 NULL）
export function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return isNaN(n) ? null : n
}
