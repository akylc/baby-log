import { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { hashPassword, verifyPassword, signToken, verifyToken } from '../auth'
import { ok, fail } from '../reply'

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/api/auth/register', async (req, reply) => {
    const b = req.body as any
    const username = String(b?.username || '').trim()
    const password = String(b?.password || '')
    if (username.length < 2 || password.length < 6)
      return reply.code(400).send(fail('用户名至少2位、密码至少6位'))
    if (db.prepare('SELECT id FROM users WHERE username=?').get(username))
      return reply.code(409).send(fail('用户名已存在'))
    const { hash, salt } = hashPassword(password)
    const info = db.prepare('INSERT INTO users(username, password_hash, salt) VALUES(?,?,?)').run(username, hash, salt)
    const uid = Number(info.lastInsertRowid)
    return ok({ token: signToken({ uid }), user: { id: uid, username } })
  })

  fastify.post('/api/auth/login', async (req, reply) => {
    const b = req.body as any
    const username = String(b?.username || '').trim()
    const password = String(b?.password || '')
    const row = db.prepare('SELECT * FROM users WHERE username=?').get(username) as any
    if (!row || !verifyPassword(password, row.salt, row.password_hash))
      return reply.code(401).send(fail('用户名或密码错误'))
    return ok({ token: signToken({ uid: row.id }), user: { id: row.id, username: row.username } })
  })

  fastify.get('/api/auth/me', async (req, reply) => {
    // 全局鉴权钩子对 /api/auth/ 放行，这里自行校验 token 取 userId
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    const payload = verifyToken(token)
    if (!payload?.uid) return reply.code(401).send(fail('未登录或登录已过期'))
    const row = db.prepare('SELECT id, username FROM users WHERE id=?').get(payload.uid) as any
    if (!row) return ok(null)
    return ok({ id: row.id, username: row.username })
  })
}

export default authRoutes
