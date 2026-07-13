import axios from 'axios'
import { markVersionStale } from '@/utils/version'

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
// 约定：所有请求均用 POST（参数放 body）；PUT/DELETE 用于更新/删除
const http = axios.create({
  baseURL: '/',
  timeout: 15000,
})

// 前端版本号（构建时由 Vite define 注入，见 vite.config.ts），随每个请求头带上，
// 供后端做版本握手校验，避免项目更新后前后端数据不一致。
const APP_VERSION = (import.meta.env as any).VITE_APP_VERSION || ''

http.interceptors.request.use((cfg) => {
  const t = getToken()
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  if (APP_VERSION) cfg.headers['X-App-Version'] = APP_VERSION
  return cfg
})

// 处理后端「版本不一致」响应（code:2）——置位全局状态并触发刷新弹框
function handleVersionMismatch(d: any) {
  if (d && d.code === 2) {
    markVersionStale(d?.data?.serverVersion, d?.data?.clientVersion)
    return true
  }
  return false
}

http.interceptors.response.use(
  (res) => {
    const d = res.data
    if (d && d.code === 0) return d.data
    if (handleVersionMismatch(d)) {
      return Promise.reject(new Error(d?.message || '前后端版本不一致'))
    }
    return Promise.reject(new Error(d?.message || '请求失败'))
  },
  (err) => {
    const d = err.response?.data
    if (handleVersionMismatch(d)) {
      return Promise.reject(new Error(d?.message || '前后端版本不一致'))
    }
    const msg = d?.message || err.message || '网络错误'
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
export async function put<T = any>(url: string, body: any = {}): Promise<T> {
  return http.put(url, body)
}
export async function del<T = any>(url: string): Promise<T> {
  return http.delete(url)
}
export default post
