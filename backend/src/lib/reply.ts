// 统一响应结构：{ code, data, message }
// 成功 code=0；失败用 HTTP 状态码 + { code, message }

export const ok = (data: any, message = '') => ({ code: 0, data, message })

export const failBody = (message: string, code = 1) => ({ code, message })
