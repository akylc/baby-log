import { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { getBabyByUser, dateRange, rangeFromTo, localNow } from '../helpers'
import { ok, fail } from '../reply'

// 症状记录：仅需时间、可选快捷标签（发烧/呕吐/咳嗽/湿疹…）与备注，无其他结构化数据
const symptomRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/api/symptoms', async (req, reply) => {
    const uid = (req as any).userId as number
    const b = req.body as any
    const baby = getBabyByUser(uid, b?.babyId ? Number(b.babyId) : undefined)
    if (!baby) return reply.code(404).send(fail('请先在「我的」中创建宝宝'))
    const occurred_at = b?.occurred_at ? String(b.occurred_at) : localNow()
    const symptom_tag = b?.symptom_tag ? String(b.symptom_tag) : null
    const info = db.prepare(
      'INSERT INTO symptoms(baby_id,symptom_tag,note,occurred_at) VALUES(?,?,?,?)',
    ).run(baby.id, symptom_tag, b?.note ?? null, occurred_at)
    return ok(db.prepare('SELECT * FROM symptoms WHERE id=?').get(Number(info.lastInsertRowid)))
  })

  fastify.post('/api/symptoms/list', async (req) => {
    const uid = (req as any).userId as number
    const b = req.body as any
    const baby = getBabyByUser(uid, b?.babyId ? Number(b.babyId) : undefined)
    if (!baby) return ok([])
    const { start, end } = b?.from && b?.to ? rangeFromTo(b.from, b.to) : dateRange(b?.date)
    const rows = db.prepare(
      'SELECT * FROM symptoms WHERE baby_id=? AND occurred_at >= ? AND occurred_at < ? ORDER BY occurred_at DESC',
    ).all(baby.id, start, end)
    return ok(rows)
  })

  fastify.put('/api/symptoms/:id', async (req, reply) => {
    const uid = (req as any).userId as number
    const id = Number((req.params as any).id)
    const b = req.body as any
    const baby = getBabyByUser(uid)
    if (!baby) return reply.code(404).send(fail('请先在「我的」中创建宝宝'))
    const row: any = db.prepare('SELECT * FROM symptoms WHERE id=? AND baby_id=?').get(id, baby.id)
    if (!row) return reply.code(404).send(fail('记录不存在'))
    const sets: string[] = []
    const vals: any[] = []
    if (b?.symptom_tag !== undefined) {
      sets.push('symptom_tag=?')
      vals.push(b.symptom_tag ? String(b.symptom_tag) : null)
    }
    if (b?.note !== undefined) {
      sets.push('note=?')
      vals.push(b.note ?? null)
    }
    if (b?.occurred_at) {
      sets.push('occurred_at=?')
      vals.push(String(b.occurred_at))
    }
    if (!sets.length) return ok(row)
    vals.push(id)
    db.prepare(`UPDATE symptoms SET ${sets.join(', ')} WHERE id=?`).run(...vals)
    return ok(db.prepare('SELECT * FROM symptoms WHERE id=?').get(id))
  })

  fastify.delete('/api/symptoms/:id', async (req, reply) => {
    const uid = (req as any).userId as number
    const id = Number((req.params as any).id)
    const baby = getBabyByUser(uid)
    if (!baby) return reply.code(404).send(fail('请先在「我的」中创建宝宝'))
    const row = db.prepare('SELECT * FROM symptoms WHERE id=? AND baby_id=?').get(id, baby.id)
    if (!row) return reply.code(404).send(fail('记录不存在'))
    db.prepare('DELETE FROM symptoms WHERE id=?').run(id)
    return ok({ id })
  })
}

export default symptomRoutes
