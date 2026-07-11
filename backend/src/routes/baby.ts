import { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { getBabyByUser } from '../helpers'
import { ok, fail } from '../reply'

const babyRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/baby', async (req) => {
    const uid = (req as any).userId as number
    return ok(getBabyByUser(uid) || null)
  })

  fastify.post('/api/baby', async (req, reply) => {
    const uid = (req as any).userId as number
    const b = req.body as any
    const name = String(b?.name || '').trim()
    if (!name) return reply.code(400).send(fail('请填写宝宝名字'))
    const existing = db.prepare('SELECT id FROM babies WHERE user_id=?').get(uid) as any
    if (existing) {
      db.prepare('UPDATE babies SET name=?, birthday=?, gender=? WHERE id=?')
        .run(name, b?.birthday ?? null, b?.gender ?? 'unknown', existing.id)
      return ok(db.prepare('SELECT * FROM babies WHERE id=?').get(existing.id))
    }
    const info = db.prepare('INSERT INTO babies(user_id, name, birthday, gender) VALUES(?,?,?,?)')
      .run(uid, name, b?.birthday ?? null, b?.gender ?? 'unknown')
    return ok(db.prepare('SELECT * FROM babies WHERE id=?').get(Number(info.lastInsertRowid)))
  })
}

export default babyRoutes
