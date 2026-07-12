import { post } from './client'

export interface DayStats {
  total_milk_ml: number
  feed_count: number
  avg_interval_min: number
  sleep_min: number
  diaper_count: number
}

export function getStats(date?: string, babyId?: number) {
  return post<DayStats>('/api/stats', { date, babyId })
}
