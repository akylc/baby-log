import { post, get } from './client'

export interface Baby {
  id: number
  user_id: number
  name: string
  birthday: string | null
  gender: 'male' | 'female' | 'unknown'
  created_at: string
}

export function getBaby() {
  return get<Baby | null>('/api/baby')
}

export function saveBaby(payload: { name: string; birthday?: string | null; gender?: string }) {
  return post<Baby>('/api/baby', payload)
}
