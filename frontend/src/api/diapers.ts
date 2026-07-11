import { post, get } from './client'

export type DiaperType = 'pee' | 'poo' | 'both'

export interface Diaper {
  id: number
  baby_id: number
  type: DiaperType
  note: string | null
  occurred_at: string
}

export function createDiaper(p: { type: DiaperType; note?: string | null; occurred_at?: string }) {
  return post<Diaper>('/api/diapers', p)
}

export function listDiapers(opts?: { date?: string; from?: string; to?: string }) {
  const q: Record<string, string> = {}
  if (opts?.date) q.date = opts.date
  else if (opts?.from && opts?.to) {
    q.from = opts.from
    q.to = opts.to
  }
  return get<Diaper[]>('/api/diapers', Object.keys(q).length ? q : undefined)
}
