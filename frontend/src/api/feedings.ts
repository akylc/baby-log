import { post, get } from './client'

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
}) {
  return post<Feeding>('/api/feedings', p)
}

export function listFeedings(date?: string) {
  return get<Feeding[]>('/api/feedings', date ? { date } : undefined)
}

export function getLastFeeding() {
  return get<Feeding | null>('/api/feedings/last')
}
