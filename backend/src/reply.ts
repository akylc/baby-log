// 统一响应结构：{ code, data, message }
export function ok(data: unknown) {
  return { code: 0, data, message: '' }
}
export function fail(message: string) {
  return { code: 1, message }
}
