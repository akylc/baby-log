import { post, put, del } from './client'

export interface Symptom {
  id: number
  baby_id: number
  symptom_tag: string | null // 症状快捷标签（发烧/呕吐/咳嗽/湿疹…，选填）
  note: string | null
  occurred_at: string
}

export function createSymptom(p: {
  symptom_tag?: string | null
  note?: string | null
  occurred_at?: string
  babyId?: number
}) {
  return post<Symptom>('/api/symptoms', p)
}

export function listSymptoms(opts?: { date?: string; from?: string; to?: string; babyId?: number }) {
  return post<Symptom[]>('/api/symptoms/list', opts || {})
}

export function updateSymptom(
  id: number,
  p: { symptom_tag?: string | null; note?: string | null; occurred_at?: string },
) {
  return put<Symptom>(`/api/symptoms/${id}`, p)
}

export function deleteSymptom(id: number) {
  return del<{ id: number }>(`/api/symptoms/${id}`)
}
