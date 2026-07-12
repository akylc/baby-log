import { post, get, put, del } from './client'

export interface Baby {
  id: number
  user_id: number
  name: string
  birthday: string | null
  gender: 'male' | 'female' | 'unknown'
  created_at: string
}

export function getBabies() {
  return get<Baby[]>('/api/babies')
}

export function addBaby(payload: { name: string; birthday?: string | null; gender?: string }) {
  return post<Baby>('/api/baby', payload)
}

export function updateBaby(
  id: number,
  payload: { name?: string; birthday?: string | null; gender?: string },
) {
  return put<Baby>(`/api/baby/${id}`, payload)
}

export function deleteBaby(id: number) {
  return del<{ id: number }>(`/api/baby/${id}`)
}
