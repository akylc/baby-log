import { post, put, del } from './client'

export interface Sleep {
  id: number
  baby_id: number
  duration_min: number
  sleep_start: string | null      // 入睡时间 (ISO 8601)
  sleep_end: string | null        // 醒来时间 (ISO 8601)
  note: string | null
  occurred_at: string
}

export function createSleep(p: {
  duration_min?: number
  sleep_start?: string
  sleep_end?: string
  note?: string | null
  occurred_at?: string
  babyId?: number
}) {
  return post<Sleep>('/api/sleeps', p)
}

export function listSleeps(opts?: { date?: string; from?: string; to?: string; babyId?: number }) {
  return post<Sleep[]>('/api/sleeps/list', opts || {})
}

export function updateSleep(
  id: number,
  p: { duration_min?: number; sleep_start?: string; sleep_end?: string; note?: string | null; occurred_at?: string },
) {
  return put<Sleep>(`/api/sleeps/${id}`, p)
}

export function deleteSleep(id: number) {
  return del<{ id: number }>(`/api/sleeps/${id}`)
}
