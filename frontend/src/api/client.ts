import axios from 'axios'

// 统一响应结构：{ code, data, message }
// 约定：所有数据接口一律 POST，参数放请求体
const http = axios.create({
  baseURL: '/',
  timeout: 15000,
})

http.interceptors.response.use(
  (res) => {
    const d = res.data
    if (d && d.code === 0) return d.data
    return Promise.reject(new Error(d?.message || '请求失败'))
  },
  (err) => {
    const msg = err.response?.data?.message || err.message || '网络错误'
    return Promise.reject(new Error(msg))
  },
)

export async function post<T = any>(url: string, body: any = {}): Promise<T> {
  return http.post(url, body)
}

export default post
