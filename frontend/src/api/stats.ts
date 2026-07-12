import { get } from './client'

export interface DayStats {
  total_milk_ml: number
  feed_count: number
  avg_interval_min: number
  sleep_min: number
  diaper_count: number
}

export function getStats(date?: string, babyId?: number) {
  const q: Record<string, any> = {}
  if (date) q.date = date
  if (babyId != null) q.babyId = babyId
  return get<DayStats>('/api/stats', Object.keys(q).length ? q : undefined)
}
