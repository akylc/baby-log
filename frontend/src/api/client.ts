import axios from 'axios'

const TOKEN_KEY = 'ml_token'

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ''
}
export function setToken(t: string): void {
  localStorage.setItem(TOKEN_KEY, t)
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// 统一响应结构：{ code, data, message }
// 约定：写入类接口 POST（参数放 body）；查询类接口 GET（参数放 query）
const http = axios.create({
  baseURL: '/',
  timeout: 15000,
})

http.interceptors.request.use((cfg) => {
  const t = getToken()
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

http.interceptors.response.use(
  (res) => {
    const d = res.data
    if (d && d.code === 0) return d.data
    return Promise.reject(new Error(d?.message || '请求失败'))
  },
  (err) => {
    const msg = err.response?.data?.message || err.message || '网络错误'
    if (err.response?.status === 401) clearToken()
    return Promise.reject(new Error(msg))
  },
)

export async function post<T = any>(url: string, body: any = {}): Promise<T> {
  return http.post(url, body)
}
export async function get<T = any>(url: string, params?: any): Promise<T> {
  return http.get(url, { params })
}
export default post
