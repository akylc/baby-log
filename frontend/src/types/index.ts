export interface Topic {
  id: number
  user_id: number
  name: string
  icon: string | null
  note: string | null
  created_at: string
  updated_at: string
  event_count?: number
}

export interface TopicTag {
  id: number
  topic_id: number
  name: string
  color: string | null
}

export interface EventItem {
  id: number
  topic_id: number
  title: string
  occurred_at: string
  note: string | null
  created_at: string
  updated_at: string
  tags?: TopicTag[]
}

export interface RecordType {
  id: number
  key: string
  label: string
  icon: string | null
  schema: string
}

export interface RecordItem {
  id: number
  event_id: number
  type_id: number
  payload: string
  created_at: string
  updated_at: string
  tags?: TopicTag[]
}

export interface EventDetail extends EventItem {
  records: RecordItem[]
}
