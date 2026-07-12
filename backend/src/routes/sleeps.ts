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
    let duration = numOrNull(b?.duration_min)
    const sleep_start = b?.sleep_start ? String(b.sleep_start) : null
    const sleep_end = b?.sleep_end ? String(b.sleep_end) : null
    // 若提供了入睡/醒来时间，自动计算时长
    if (sleep_start && sleep_end) {
      const diffMs = new Date(sleep_end).getTime() - new Date(sleep_start).getTime()
      duration = Math.ceil(diffMs / 60000)
      if (duration <= 0) return reply.code(400).send(fail('醒来时间必须晚于入睡时间'))
    } else if (sleep_start) {
      // 仅记录入睡时间（醒来后补充醒来时间）
      duration = 0
    }
    if (duration === null || duration < 0) return reply.code(400).send(fail('请填写有效的睡眠时长'))
    const occurred_at = sleep_start || (b?.occurred_at ? String(b.occurred_at) : localNow())
    const info = db.prepare(
      'INSERT INTO sleeps(baby_id,duration_min,sleep_start,sleep_end,note,occurred_at) VALUES(?,?,?,?,?,?)',
    ).run(baby.id, duration, sleep_start, sleep_end, b?.note ?? null, occurred_at)
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
    // 若传了 sleep_start / sleep_end，优先用它们算 duration_min；否则兼容旧字段
    const sleep_start = b?.sleep_start !== undefined ? String(b.sleep_start) : undefined
    const sleep_end = b?.sleep_end !== undefined ? String(b.sleep_end) : undefined
    if (sleep_start !== undefined || sleep_end !== undefined) {
      const ss = sleep_start !== undefined ? sleep_start : row.sleep_start
      const se = sleep_end !== undefined ? sleep_end : row.sleep_end
      if (ss && se) {
        const diffMs = new Date(se).getTime() - new Date(ss).getTime()
        const dur = Math.ceil(diffMs / 60000)
        if (dur <= 0) return reply.code(400).send(fail('醒来时间必须晚于入睡时间'))
        sets.push('duration_min=?'); vals.push(dur)
        sets.push('sleep_start=?'); vals.push(ss)
        sets.push('sleep_end=?'); vals.push(se)
      }
    }
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
