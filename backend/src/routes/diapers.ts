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

  fastify.post('/api/diapers/list', async (req) => {
    const uid = (req as any).userId as number
    const b = req.body as any
    const baby = getBabyByUser(uid, b?.babyId ? Number(b.babyId) : undefined)
    if (!baby) return ok([])
    const { start, end } = b?.from && b?.to ? rangeFromTo(b.from, b.to) : dateRange(b?.date)
    const rows = db.prepare(
      'SELECT * FROM diapers WHERE baby_id=? AND occurred_at >= ? AND occurred_at < ? ORDER BY occurred_at DESC',
    ).all(baby.id, start, end)
    return ok(rows)
  })

  fastify.put('/api/diapers/:id', async (req, reply) => {
    const uid = (req as any).userId as number
    const id = Number((req.params as any).id)
    const b = req.body as any
    const baby = getBabyByUser(uid)
    if (!baby) return reply.code(404).send(fail('请先在「我的」中创建宝宝'))
    const row: any = db.prepare('SELECT * FROM diapers WHERE id=? AND baby_id=?').get(id, baby.id)
    if (!row) return reply.code(404).send(fail('记录不存在'))
    const sets: string[] = []
    const vals: any[] = []
    if (b?.type !== undefined) {
      if (!['pee', 'poo', 'both'].includes(b.type)) return reply.code(400).send(fail('尿布类型不合法'))
      sets.push('type=?')
      vals.push(b.type)
    }
    if (b?.note !== undefined) { sets.push('note=?'); vals.push(b.note ?? null) }
    if (b?.occurred_at) { sets.push('occurred_at=?'); vals.push(String(b.occurred_at)) }
    if (!sets.length) return ok(row)
    vals.push(id)
    db.prepare(`UPDATE diapers SET ${sets.join(', ')} WHERE id=?`).run(...vals)
    return ok(db.prepare('SELECT * FROM diapers WHERE id=?').get(id))
  })

  fastify.delete('/api/diapers/:id', async (req, reply) => {
    const uid = (req as any).userId as number
    const id = Number((req.params as any).id)
    const baby = getBabyByUser(uid)
    if (!baby) return reply.code(404).send(fail('请先在「我的」中创建宝宝'))
    const row = db.prepare('SELECT * FROM diapers WHERE id=? AND baby_id=?').get(id, baby.id)
    if (!row) return reply.code(404).send(fail('记录不存在'))
    db.prepare('DELETE FROM diapers WHERE id=?').run(id)
    return ok({ id })
  })
}

export default diaperRoutes
