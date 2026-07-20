import { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { getBabyByUser, dateRange, rangeFromTo, localNow } from '../helpers'
import { ok, fail } from '../reply'

// 用药记录：药品名（必填）+ 剂量（选填）+ 备注（选填）+ 时间
const medicineRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/api/medicines', async (req, reply) => {
    const uid = (req as any).userId as number
    const b = req.body as any
    const baby = getBabyByUser(uid, b?.babyId ? Number(b.babyId) : undefined)
    if (!baby) return reply.code(404).send(fail('请先在「我的」中创建宝宝'))
    const occurred_at = b?.occurred_at ? String(b.occurred_at) : localNow()
    const medicine_name = b?.medicine_name ? String(b.medicine_name) : null
    if (!medicine_name) return reply.code(400).send(fail('请填写药品名称'))
    const dosage = b?.dosage ? String(b.dosage) : null
    const info = db.prepare(
      'INSERT INTO medicines(baby_id,medicine_name,dosage,note,occurred_at) VALUES(?,?,?,?,?)',
    ).run(baby.id, medicine_name, dosage, b?.note ?? null, occurred_at)
    return ok(db.prepare('SELECT * FROM medicines WHERE id=?').get(Number(info.lastInsertRowid)))
  })

  fastify.post('/api/medicines/list', async (req) => {
    const uid = (req as any).userId as number
    const b = req.body as any
    const baby = getBabyByUser(uid, b?.babyId ? Number(b.babyId) : undefined)
    if (!baby) return ok([])
    const { start, end } = b?.from && b?.to ? rangeFromTo(b.from, b.to) : dateRange(b?.date)
    const rows = db.prepare(
      'SELECT * FROM medicines WHERE baby_id=? AND occurred_at >= ? AND occurred_at < ? ORDER BY occurred_at DESC',
    ).all(baby.id, start, end)
    return ok(rows)
  })

  fastify.put('/api/medicines/:id', async (req, reply) => {
    const uid = (req as any).userId as number
    const id = Number((req.params as any).id)
    const b = req.body as any
    const baby = getBabyByUser(uid)
    if (!baby) return reply.code(404).send(fail('请先在「我的」中创建宝宝'))
    const row: any = db.prepare('SELECT * FROM medicines WHERE id=? AND baby_id=?').get(id, baby.id)
    if (!row) return reply.code(404).send(fail('记录不存在'))
    const sets: string[] = []
    const vals: any[] = []
    if (b?.medicine_name !== undefined) {
      sets.push('medicine_name=?')
      vals.push(b.medicine_name ? String(b.medicine_name) : null)
    }
    if (b?.dosage !== undefined) {
      sets.push('dosage=?')
      vals.push(b.dosage ? String(b.dosage) : null)
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
    db.prepare(`UPDATE medicines SET ${sets.join(', ')} WHERE id=?`).run(...vals)
    return ok(db.prepare('SELECT * FROM medicines WHERE id=?').get(id))
  })

  fastify.delete('/api/medicines/:id', async (req, reply) => {
    const uid = (req as any).userId as number
    const id = Number((req.params as any).id)
    const baby = getBabyByUser(uid)
    if (!baby) return reply.code(404).send(fail('请先在「我的」中创建宝宝'))
    const row = db.prepare('SELECT * FROM medicines WHERE id=? AND baby_id=?').get(id, baby.id)
    if (!row) return reply.code(404).send(fail('记录不存在'))
    db.prepare('DELETE FROM medicines WHERE id=?').run(id)
    return ok({ id })
  })
}

export default medicineRoutes
