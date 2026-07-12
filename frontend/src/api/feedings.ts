import { post, put, del } from './client'

export type FeedType = 'breast' | 'formula' | 'food' | 'bottle'

export interface Feeding {
  id: number
  baby_id: number
  type: FeedType
  side: 'left' | 'right' | 'both' | null
  amount_ml: number | null
  duration_min: number | null
  left_duration_min: number | null
  right_duration_min: number | null
  food_name: string | null
  note: string | null
  occurred_at: string
}

export function createFeeding(p: {
  type: FeedType
  side?: string | null
  amount_ml?: number | null
  duration_min?: number | null
  left_duration_min?: number | null
  right_duration_min?: number | null
  food_name?: string | null
  note?: string | null
  occurred_at?: string
  babyId?: number
}) {
  return post<Feeding>('/api/feedings', p)
}

export function listFeedings(opts?: { date?: string; from?: string; to?: string; babyId?: number }) {
  return post<Feeding[]>('/api/feedings/list', opts || {})
}

export function getLastFeeding(babyId?: number) {
  return post<Feeding | null>('/api/feedings/last', babyId != null ? { babyId } : {})
}

export function updateFeeding(
  id: number,
  p: {
    left_duration_min?: number | null
    right_duration_min?: number | null
    amount_ml?: number | null
    food_name?: string | null
    note?: string | null
    occurred_at?: string
  },
) {
  return put<Feeding>(`/api/feedings/${id}`, p)
}

export function deleteFeeding(id: number) {
  return del<{ id: number }>(`/api/feedings/${id}`)
}
