import { post, put, del } from './client'

export type DiaperType = 'pee' | 'poo' | 'both'

export interface Diaper {
  id: number
  baby_id: number
  type: DiaperType
  note: string | null
  occurred_at: string
}

export function createDiaper(p: { type: DiaperType; note?: string | null; occurred_at?: string; babyId?: number }) {
  return post<Diaper>('/api/diapers', p)
}

export function listDiapers(opts?: { date?: string; from?: string; to?: string; babyId?: number }) {
  return post<Diaper[]>('/api/diapers/list', opts || {})
}

export function updateDiaper(
  id: number,
  p: { type?: DiaperType; note?: string | null; occurred_at?: string },
) {
  return put<Diaper>(`/api/diapers/${id}`, p)
}

export function deleteDiaper(id: number) {
  return del<{ id: number }>(`/api/diapers/${id}`)
}
