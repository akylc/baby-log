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

export function listSleeps(opts?: { date?: string; from?: string; to?: string }) {
  const q: Record<string, string> = {}
  if (opts?.date) q.date = opts.date
  else if (opts?.from && opts?.to) {
    q.from = opts.from
    q.to = opts.to
  }
  return get<Sleep[]>('/api/sleeps', Object.keys(q).length ? q : undefined)
}
