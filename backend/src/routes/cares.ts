import { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { getBabyByUser, dateRange, rangeFromTo, localNow } from '../helpers'
import { ok, fail } from '../reply'

// 护理类记录（洗澡 / 理发 / 剪指甲）：仅需时间与备注，无其他结构化数据
const CARE_TYPES = ['bath', 'haircut', 'nails']

const careRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/api/cares', async (req, reply) => {
    const uid = (req as any).userId as number
    const b = req.body as any
    const baby = getBabyByUser(uid, b?.babyId ? Number(b.babyId) : undefined)
    if (!baby) return reply.code(404).send(fail('请先在「我的」中创建宝宝'))
    const care_type = b?.care_type ? String(b.care_type) : null
    if (!care_type || !CARE_TYPES.includes(care_type)) {
      return reply.code(400).send(fail('请选择护理类型（洗澡 / 理发 / 剪指甲）'))
    }
    const occurred_at = b?.occurred_at ? String(b.occurred_at) : localNow()
    const info = db.prepare(
      'INSERT INTO cares(baby_id,care_type,note,occurred_at) VALUES(?,?,?,?)',
    ).run(baby.id, care_type, b?.note ?? null, occurred_at)
    return ok(db.prepare('SELECT * FROM cares WHERE id=?').get(Number(info.lastInsertRowid)))
  })

  fastify.post('/api/cares/list', async (req) => {
    const uid = (req as any).userId as number
    const b = req.body as any
    const baby = getBabyByUser(uid, b?.babyId ? Number(b.babyId) : undefined)
    if (!baby) return ok([])
    const { start, end } = b?.from && b?.to ? rangeFromTo(b.from, b.to) : dateRange(b?.date)
    const rows = db.prepare(
      'SELECT * FROM cares WHERE baby_id=? AND occurred_at >= ? AND occurred_at < ? ORDER BY occurred_at DESC',
    ).all(baby.id, start, end)
    return ok(rows)
  })

  fastify.put('/api/cares/:id', async (req, reply) => {
    const uid = (req as any).userId as number
    const id = Number((req.params as any).id)
    const b = req.body as any
    const baby = getBabyByUser(uid)
    if (!baby) return reply.code(404).send(fail('请先在「我的」中创建宝宝'))
    const row: any = db.prepare('SELECT * FROM cares WHERE id=? AND baby_id=?').get(id, baby.id)
    if (!row) return reply.code(404).send(fail('记录不存在'))
    const sets: string[] = []
    const vals: any[] = []
    if (b?.care_type !== undefined) {
      const t = String(b.care_type)
      if (!CARE_TYPES.includes(t)) return reply.code(400).send(fail('请选择护理类型（洗澡 / 理发 / 剪指甲）'))
      sets.push('care_type=?')
      vals.push(t)
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
    db.prepare(`UPDATE cares SET ${sets.join(', ')} WHERE id=?`).run(...vals)
    return ok(db.prepare('SELECT * FROM cares WHERE id=?').get(id))
  })

  fastify.delete('/api/cares/:id', async (req, reply) => {
    const uid = (req as any).userId as number
    const id = Number((req.params as any).id)
    const baby = getBabyByUser(uid)
    if (!baby) return reply.code(404).send(fail('请先在「我的」中创建宝宝'))
    const row = db.prepare('SELECT * FROM cares WHERE id=? AND baby_id=?').get(id, baby.id)
    if (!row) return reply.code(404).send(fail('记录不存在'))
    db.prepare('DELETE FROM cares WHERE id=?').run(id)
    return ok({ id })
  })
}

export default careRoutes
