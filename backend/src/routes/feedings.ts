import { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { getBabyByUser, dateRange, numOrNull, localNow } from '../helpers'
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
    const baby = getBabyByUser(uid)
    if (!baby) return ok([])
    const { start, end } = dateRange((req.query as any)?.date as string | undefined)
    const rows = db.prepare(
      'SELECT * FROM feedings WHERE baby_id=? AND occurred_at >= ? AND occurred_at < ? ORDER BY occurred_at DESC',
    ).all(baby.id, start, end)
    return ok(rows)
  })

  fastify.get('/api/feedings/last', async (req) => {
    const uid = (req as any).userId as number
    const baby = getBabyByUser(uid)
    if (!baby) return ok(null)
    const row = db.prepare(
      'SELECT * FROM feedings WHERE baby_id=? ORDER BY occurred_at DESC, id DESC LIMIT 1',
    ).get(baby.id)
    return ok(row ?? null)
  })
}

export default feedingRoutes
