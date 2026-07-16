import { post, put, del } from './client'

export interface Care {
  id: number
  baby_id: number
  care_type: string // bath | haircut | nails
  note: string | null
  occurred_at: string
}

export function createCare(p: {
  care_type: string
  note?: string | null
  occurred_at?: string
  babyId?: number
}) {
  return post<Care>('/api/cares', p)
}

export function listCares(opts?: { date?: string; from?: string; to?: string; babyId?: number }) {
  return post<Care[]>('/api/cares/list', opts || {})
}

export function updateCare(
  id: number,
  p: { care_type?: string; note?: string | null; occurred_at?: string },
) {
  return put<Care>(`/api/cares/${id}`, p)
}

export function deleteCare(id: number) {
  return del<{ id: number }>(`/api/cares/${id}`)
}
