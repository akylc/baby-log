import crypto from 'node:crypto'
import { config } from './config'

const SECRET = config.jwtSecret

// 密码哈希：scrypt（Node 内置，零额外依赖）
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return { hash, salt }
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex')
  const a = Buffer.from(candidate, 'hex')
  const b = Buffer.from(hash, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// 轻量 JWT 风格 token：base64url(header).base64url(payload).HMAC-SHA256
export function signToken(payload: object, expiresInSec = 60 * 60 * 24 * 30): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const body = { ...payload, iat: now, exp: now + expiresInSec }
  const h = b64url(JSON.stringify(header))
  const p = b64url(JSON.stringify(body))
  const sig = crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')
  return `${h}.${p}.${sig}`
}

export function verifyToken(token: string): { uid: number; exp: number } | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [h, p, sig] = parts
  const expected = crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')
  if (sig !== expected) return null
  try {
    const body = JSON.parse(b64urlDecode(p)) as { uid: number; exp: number }
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null
    return body
  } catch {
    return null
  }
}

function b64url(s: string): string {
  return Buffer.from(s, 'utf8').toString('base64url')
}
function b64urlDecode(s: string): string {
  return Buffer.from(s, 'base64url').toString('utf8')
}
