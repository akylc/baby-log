import { post, put, del } from './client'

export interface Play {
  id: number
  baby_id: number
  play_type: string
  duration_min: number
  play_start: string | null      // 开始时间 (ISO 8601)
  play_end: string | null        // 结束时间 (ISO 8601)
  note: string | null
  occurred_at: string
}

export function createPlay(p: {
  play_type: string
  play_start?: string
  play_end?: string
  note?: string | null
  occurred_at?: string
  babyId?: number
}) {
  return post<Play>('/api/plays', p)
}

export function listPlays(opts?: { date?: string; from?: string; to?: string; babyId?: number }) {
  return post<Play[]>('/api/plays/list', opts || {})
}

export function updatePlay(
  id: number,
  p: { play_type?: string; play_start?: string; play_end?: string; note?: string | null; occurred_at?: string },
) {
  return put<Play>(`/api/plays/${id}`, p)
}

export function deletePlay(id: number) {
  return del<{ id: number }>(`/api/plays/${id}`)
}
