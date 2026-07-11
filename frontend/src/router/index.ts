import { createRouter, createWebHistory } from 'vue-router'
import TopicList from '@/views/TopicList.vue'
import EventTimeline from '@/views/EventTimeline.vue'
import EventDetail from '@/views/EventDetail.vue'
import TypeManage from '@/views/TypeManage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'topic-list', component: TopicList },
    { path: '/topics/:id', name: 'event-timeline', component: EventTimeline },
    { path: '/events/:id', name: 'event-detail', component: EventDetail },
    { path: '/types', name: 'type-manage', component: TypeManage },
  ],
})

export default router
