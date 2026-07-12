import { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { getBabyByUser, dateRange, rangeFromTo, numOrNull, localNow } from '../helpers'
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
    const q = req.query as any
    const baby = getBabyByUser(uid, q?.babyId ? Number(q.babyId) : undefined)
    if (!baby) return ok([])
    const { start, end } = q?.from && q?.to ? rangeFromTo(q.from, q.to) : dateRange(q?.date)
    const rows = db.prepare(
      'SELECT * FROM sleeps WHERE baby_id=? AND occurred_at >= ? AND occurred_at < ? ORDER BY occurred_at DESC',
    ).all(baby.id, start, end)
    return ok(rows)
  })

  fastify.put('/api/sleeps/:id', async (req, reply) => {
    const uid = (req as any).userId as number
    const id = Number((req.params as any).id)
    const b = req.body as any
    const baby = getBabyByUser(uid)
    if (!baby) return reply.code(404).send(fail('请先在「我的」中创建宝宝'))
    const row: any = db.prepare('SELECT * FROM sleeps WHERE id=? AND baby_id=?').get(id, baby.id)
    if (!row) return reply.code(404).send(fail('记录不存在'))
    const sets: string[] = []
    const vals: any[] = []
    if (b?.duration_min !== undefined) {
      const dur = numOrNull(b.duration_min)
      if (!dur || dur <= 0) return reply.code(400).send(fail('请填写有效的睡眠时长'))
      sets.push('duration_min=?')
      vals.push(dur)
    }
    if (b?.note !== undefined) { sets.push('note=?'); vals.push(b.note ?? null) }
    if (b?.occurred_at) { sets.push('occurred_at=?'); vals.push(String(b.occurred_at)) }
    if (!sets.length) return ok(row)
    vals.push(id)
    db.prepare(`UPDATE sleeps SET ${sets.join(', ')} WHERE id=?`).run(...vals)
    return ok(db.prepare('SELECT * FROM sleeps WHERE id=?').get(id))
  })

  fastify.delete('/api/sleeps/:id', async (req, reply) => {
    const uid = (req as any).userId as number
    const id = Number((req.params as any).id)
    const baby = getBabyByUser(uid)
    if (!baby) return reply.code(404).send(fail('请先在「我的」中创建宝宝'))
    const row = db.prepare('SELECT * FROM sleeps WHERE id=? AND baby_id=?').get(id, baby.id)
    if (!row) return reply.code(404).send(fail('记录不存在'))
    db.prepare('DELETE FROM sleeps WHERE id=?').run(id)
    return ok({ id })
  })
}

export default sleepRoutes
