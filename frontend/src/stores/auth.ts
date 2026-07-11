import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as apiLogin, register as apiRegister, getMe } from '@/api/auth'
import { getToken, setToken, clearToken } from '@/api/client'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(getToken())
  const user = ref<{ id: number; username: string } | null>(null)
  const isLoggedIn = ref(!!getToken())

  async function login(username: string, password: string) {
    const res = await apiLogin(username, password)
    token.value = res.token
    user.value = res.user
    isLoggedIn.value = true
    setToken(res.token)
  }

  async function register(username: string, password: string) {
    const res = await apiRegister(username, password)
    token.value = res.token
    user.value = res.user
    isLoggedIn.value = true
    setToken(res.token)
  }

  // 刷新后 store 重置，但 token 仍在：用 token 拉取当前用户信息
  async function fetchMe() {
    try {
      const u = await getMe()
      if (u) user.value = u
    } catch {
      /* 401 等交给路由守卫处理 */
    }
    return user.value
  }

  function logout() {
    token.value = ''
    user.value = null
    isLoggedIn.value = false
    clearToken()
  }

  return { token, user, isLoggedIn, login, register, fetchMe, logout }
})
