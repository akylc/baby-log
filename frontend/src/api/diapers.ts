import { post, get, put, del } from './client'

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
  const q: Record<string, any> = {}
  if (opts?.date) q.date = opts.date
  else if (opts?.from && opts?.to) {
    q.from = opts.from
    q.to = opts.to
  }
  if (opts?.babyId != null) q.babyId = opts.babyId
  return get<Diaper[]>('/api/diapers', Object.keys(q).length ? q : undefined)
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
