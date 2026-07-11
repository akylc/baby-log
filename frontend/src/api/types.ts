import post from './client'

export const typesApi = {
  list: () => post('/api/types/list'),
  create: (body: any) => post('/api/types/create', body),
}
