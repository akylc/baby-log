import { post, put, del } from './client'

export interface Medicine {
  id: number
  baby_id: number
  medicine_name: string // 药品名称（必填）
  dosage: string | null // 剂量（如 2.5ml / 1片，选填）
  note: string | null
  occurred_at: string
}

export function createMedicine(p: {
  medicine_name: string
  dosage?: string | null
  note?: string | null
  occurred_at?: string
  babyId?: number
}) {
  return post<Medicine>('/api/medicines', p)
}

export function listMedicines(opts?: { date?: string; from?: string; to?: string; babyId?: number }) {
  return post<Medicine[]>('/api/medicines/list', opts || {})
}

export function updateMedicine(
  id: number,
  p: { medicine_name?: string; dosage?: string | null; note?: string | null; occurred_at?: string },
) {
  return put<Medicine>(`/api/medicines/${id}`, p)
}

export function deleteMedicine(id: number) {
  return del<{ id: number }>(`/api/medicines/${id}`)
}
