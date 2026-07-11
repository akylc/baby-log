import { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { getBabyByUser, dateRange, rangeFromTo, localNow } from '../helpers'
import { ok, fail } from '../reply'

const diaperRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/api/diapers', async (req, reply) => {
    const uid = (req as any).userId as number
    const b = req.body as any
    const baby = getBabyByUser(uid, b?.babyId ? Number(b.babyId) : undefined)
    if (!baby) return reply.code(404).send(fail('请先在「我的」中创建宝宝'))
    const type = String(b?.type || '')
    if (!['pee', 'poo', 'both'].includes(type)) return reply.code(400).send(fail('尿布类型不合法'))
    const occurred_at = b?.occurred_at ? String(b.occurred_at) : localNow()
    const info = db.prepare(
      'INSERT INTO diapers(baby_id,type,note,occurred_at) VALUES(?,?,?,?)',
    ).run(baby.id, type, b?.note ?? null, occurred_at)
    return ok(db.prepare('SELECT * FROM diapers WHERE id=?').get(Number(info.lastInsertRowid)))
  })

  fastify.get('/api/diapers', async (req) => {
    const uid = (req as any).userId as number
    const baby = getBabyByUser(uid)
    if (!baby) return ok([])
    const q = req.query as any
    const { start, end } = q?.from && q?.to ? rangeFromTo(q.from, q.to) : dateRange(q?.date)
    const rows = db.prepare(
      'SELECT * FROM diapers WHERE baby_id=? AND occurred_at >= ? AND occurred_at < ? ORDER BY occurred_at DESC',
    ).all(baby.id, start, end)
    return ok(rows)
  })
}

export default diaperRoutes
