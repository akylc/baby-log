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

export function listDiapers(date?: string) {
  return get<Diaper[]>('/api/diapers', date ? { date } : undefined)
}
