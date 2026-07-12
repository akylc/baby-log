// 宝宝生日等场景：禁止选择 / 设置晚于今天的日期

export function startOfToday(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

// 供 n-date-picker 的 is-date-disabled 使用：返回 true 表示禁用（即未来日期）
export function disableFutureDate(ts: number): boolean {
  return ts > startOfToday()
}

// 校验生日是否超出今天（含当天 23:59:59 仍允许）
export function isBirthdayInFuture(ts: number | null | undefined): boolean {
  if (ts == null) return false
  const endOfToday = startOfToday() + 24 * 60 * 60 * 1000 - 1
  return ts > endOfToday
}
