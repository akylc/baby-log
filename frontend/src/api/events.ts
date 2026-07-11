import post from './client'

export const eventsApi = {
  list: (body: any = {}) => post('/api/events/list', body),
  create: (body: any) => post('/api/events/create', body),
  detail: (id: number) => post('/api/events/detail', { id }),
  update: (body: any) => post('/api/events/update', body),
  remove: (id: number) => post('/api/events/delete', { id }),
  records: (eventId: number) => post('/api/events/records', { eventId }),
}
