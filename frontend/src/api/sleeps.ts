import { post, get } from './client'

export interface Sleep {
  id: number
  baby_id: number
  duration_min: number
  note: string | null
  occurred_at: string
}

export function createSleep(p: { duration_min: number; note?: string | null; occurred_at?: string }) {
  return post<Sleep>('/api/sleeps', p)
}

export function listSleeps(date?: string) {
  return get<Sleep[]>('/api/sleeps', date ? { date } : undefined)
}
