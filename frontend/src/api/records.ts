import post from './client'

export const recordsApi = {
  create: (body: any) => post('/api/events/records/create', body),
  update: (body: any) => post('/api/records/update', body),
  remove: (id: number) => post('/api/records/delete', { id }),
}
