import axios from 'axios'

// 图片上传走 multipart/form-data（不走统一 POST-JSON 封装）
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await axios.post('/api/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  if (res.data?.code === 0) return res.data.data.url
  throw new Error(res.data?.message || '上传失败')
}
