import { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { getBabyByUser, dateRange, numOrNull, localNow } from '../helpers'
import { ok, fail } from '../reply'

const sleepRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/api/sleeps', async (req, reply) => {
    const uid = (req as any).userId as number
    const b = req.body as any
    const baby = getBabyByUser(uid, b?.babyId ? Number(b.babyId) : undefined)
    if (!baby) return reply.code(404).send(fail('请先在「我的」中创建宝宝'))
    const duration = numOrNull(b?.duration_min)
    if (!duration || duration <= 0) return reply.code(400).send(fail('请填写有效的睡眠时长'))
    const occurred_at = b?.occurred_at ? String(b.occurred_at) : localNow()
    const info = db.prepare(
      'INSERT INTO sleeps(baby_id,duration_min,note,occurred_at) VALUES(?,?,?,?)',
    ).run(baby.id, duration, b?.note ?? null, occurred_at)
    return ok(db.prepare('SELECT * FROM sleeps WHERE id=?').get(Number(info.lastInsertRowid)))
  })

  fastify.get('/api/sleeps', async (req) => {
    const uid = (req as any).userId as number
    const baby = getBabyByUser(uid)
    if (!baby) return ok([])
    const { start, end } = dateRange((req.query as any)?.date as string | undefined)
    const rows = db.prepare(
      'SELECT * FROM sleeps WHERE baby_id=? AND occurred_at >= ? AND occurred_at < ? ORDER BY occurred_at DESC',
    ).all(baby.id, start, end)
    return ok(rows)
  })
}

export default sleepRoutes
