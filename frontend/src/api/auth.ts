import { post, get } from './client'

export interface AuthResult {
  token: string
  user: { id: number; username: string }
}

export interface UserInfo {
  id: number
  username: string
}

export function register(username: string, password: string) {
  return post<AuthResult>('/api/auth/register', { username, password })
}

export function login(username: string, password: string) {
  return post<AuthResult>('/api/auth/login', { username, password })
}

export function getMe() {
  return get<UserInfo | null>('/api/auth/me')
}
