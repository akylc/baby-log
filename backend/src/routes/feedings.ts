import { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { getBabyByUser, dateRange, rangeFromTo, numOrNull, localNow } from '../helpers'
import { ok, fail } from '../reply'

const feedingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/api/feedings', async (req, reply) => {
    const uid = (req as any).userId as number
    const b = req.body as any
    const baby = getBabyByUser(uid, b?.babyId ? Number(b.babyId) : undefined)
    if (!baby) return reply.code(404).send(fail('请先在「我的」中创建宝宝'))
    const type = String(b?.type || '')
    if (!['breast', 'formula', 'food', 'bottle'].includes(type)) return reply.code(400).send(fail('喂养类型不合法'))
    // 核心数据必填校验
    if (type === 'breast') {
      const l = numOrNull(b?.left_duration_min)
      const r = numOrNull(b?.right_duration_min)
      if (!l && !r) return reply.code(400).send(fail('请填写母乳时长（左乳或右乳至少一项）'))
    } else if (type === 'formula' || type === 'bottle') {
      const a = numOrNull(b?.amount_ml)
      if (!a || a <= 0) return reply.code(400).send(fail('请填写奶量'))
    } else if (type === 'food') {
      if (!b?.food_name || !String(b.food_name).trim()) return reply.code(400).send(fail('请填写辅食名称'))
    }
    const occurred_at = b?.occurred_at ? String(b.occurred_at) : localNow()
    const info = db.prepare(
      `INSERT INTO feedings(baby_id,type,side,amount_ml,duration_min,left_duration_min,right_duration_min,food_name,note,occurred_at)
       VALUES(?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      baby.id,
      type,
      null, // side 已废弃
      numOrNull(b?.amount_ml),
      null, // duration_min 已废弃
      numOrNull(b?.left_duration_min),
      numOrNull(b?.right_duration_min),
      b?.food_name ?? null,
      b?.note ?? null,
      occurred_at,
    )
    return ok(db.prepare('SELECT * FROM feedings WHERE id=?').get(Number(info.lastInsertRowid)))
  })

  fastify.get('/api/feedings', async (req) => {
    const uid = (req as any).userId as number
    const q = req.query as any
    const baby = getBabyByUser(uid, q?.babyId ? Number(q.babyId) : undefined)
    if (!baby) return ok([])
    const { start, end } = q?.from && q?.to ? rangeFromTo(q.from, q.to) : dateRange(q?.date)
    const rows = db.prepare(
      'SELECT * FROM feedings WHERE baby_id=? AND occurred_at >= ? AND occurred_at < ? ORDER BY occurred_at DESC',
    ).all(baby.id, start, end)
    return ok(rows)
  })

  fastify.get('/api/feedings/last', async (req) => {
    const uid = (req as any).userId as number
    const q = req.query as any
    const baby = getBabyByUser(uid, q?.babyId ? Number(q.babyId) : undefined)
    if (!baby) return ok(null)
    const row = db.prepare(
      'SELECT * FROM feedings WHERE baby_id=? ORDER BY occurred_at DESC, id DESC LIMIT 1',
    ).get(baby.id)
    return ok(row ?? null)
  })

  fastify.put('/api/feedings/:id', async (req, reply) => {
    const uid = (req as any).userId as number
    const id = Number((req.params as any).id)
    const b = req.body as any
    const baby = getBabyByUser(uid)
    if (!baby) return reply.code(404).send(fail('请先在「我的」中创建宝宝'))
    const row: any = db.prepare('SELECT * FROM feedings WHERE id=? AND baby_id=?').get(id, baby.id)
    if (!row) return reply.code(404).send(fail('记录不存在'))
    const sets: string[] = []
    const vals: any[] = []
    const t = row.type as string
    if (t === 'breast') {
      const l = b?.left_duration_min !== undefined ? numOrNull(b.left_duration_min) : row.left_duration_min
      const r = b?.right_duration_min !== undefined ? numOrNull(b.right_duration_min) : row.right_duration_min
      if (!l && !r) return reply.code(400).send(fail('请至少填写一侧母乳时长'))
      if (b?.left_duration_min !== undefined) { sets.push('left_duration_min=?'); vals.push(l) }
      if (b?.right_duration_min !== undefined) { sets.push('right_duration_min=?'); vals.push(r) }
    } else if (t === 'formula' || t === 'bottle') {
      if (b?.amount_ml !== undefined) { sets.push('amount_ml=?'); vals.push(numOrNull(b.amount_ml)) }
    } else if (t === 'food') {
      if (b?.food_name !== undefined) { sets.push('food_name=?'); vals.push(b.food_name ?? null) }
    }
    if (b?.note !== undefined) { sets.push('note=?'); vals.push(b.note ?? null) }
    if (b?.occurred_at) { sets.push('occurred_at=?'); vals.push(String(b.occurred_at)) }
    if (!sets.length) return ok(row)
    vals.push(id)
    db.prepare(`UPDATE feedings SET ${sets.join(', ')} WHERE id=?`).run(...vals)
    return ok(db.prepare('SELECT * FROM feedings WHERE id=?').get(id))
  })

  fastify.delete('/api/feedings/:id', async (req, reply) => {
    const uid = (req as any).userId as number
    const id = Number((req.params as any).id)
    const baby = getBabyByUser(uid)
    if (!baby) return reply.code(404).send(fail('请先在「我的」中创建宝宝'))
    const row = db.prepare('SELECT * FROM feedings WHERE id=? AND baby_id=?').get(id, baby.id)
    if (!row) return reply.code(404).send(fail('记录不存在'))
    db.prepare('DELETE FROM feedings WHERE id=?').run(id)
    return ok({ id })
  })
}

export default feedingRoutes
