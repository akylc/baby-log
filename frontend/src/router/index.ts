import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/api/client'
import Login from '@/views/Login.vue'
import Home from '@/views/Home.vue'
import Record from '@/views/Record.vue'
import Baby from '@/views/Baby.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: Login },
    { path: '/', name: 'home', component: Home, meta: { requiresAuth: true } },
    { path: '/record', name: 'record', component: Record, meta: { requiresAuth: true } },
    { path: '/baby', name: 'baby', component: Baby, meta: { requiresAuth: true } },
  ],
})

router.beforeEach((to) => {
  const token = getToken()
  if (to.meta.requiresAuth && !token) return { name: 'login' }
  if (to.name === 'login' && token) return { name: 'home' }
  return true
})

export default router
