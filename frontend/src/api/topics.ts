import post from './client'

export const topicsApi = {
  list: () => post('/api/topics/list'),
  create: (body: any) => post('/api/topics/create', body),
  detail: (id: number) => post('/api/topics/detail', { id }),
  update: (body: any) => post('/api/topics/update', body),
  remove: (id: number) => post('/api/topics/delete', { id }),
  tags: (topicId: number) => post('/api/topics/tags', { topicId }),
  createTag: (body: any) => post('/api/topics/tags/create', body),
  updateTag: (body: any) => post('/api/topics/tags/update', body),
  removeTag: (tagId: number) => post('/api/topics/tags/delete', { tagId }),
  search: (body: any) => post('/api/topics/search', body),
}
