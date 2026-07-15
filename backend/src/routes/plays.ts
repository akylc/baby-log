import { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { getBabyByUser, dateRange, rangeFromTo, localNow } from '../helpers'
import { ok, fail } from '../reply'

const playRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/api/plays', async (req, reply) => {
    const uid = (req as any).userId as number
    const b = req.body as any
    const baby = getBabyByUser(uid, b?.babyId ? Number(b.babyId) : undefined)
    if (!baby) return reply.code(404).send(fail('请先在「我的」中创建宝宝'))
    const play_type = b?.play_type ? String(b.play_type) : null
    if (!play_type) return reply.code(400).send(fail('请填写娱乐类型'))
    let duration = 0
    const play_start = b?.play_start ? String(b.play_start) : null
    const play_end = b?.play_end ? String(b.play_end) : null
    // 若提供了开始/结束时间，自动计算时长
    if (play_start && play_end) {
      const diffMs = new Date(play_end).getTime() - new Date(play_start).getTime()
      duration = Math.ceil(diffMs / 60000)
      if (duration <= 0) return reply.code(400).send(fail('结束时间必须晚于开始时间'))
    } else if (play_start) {
      duration = 0
    }
    const occurred_at = play_start || (b?.occurred_at ? String(b.occurred_at) : localNow())
    const info = db.prepare(
      'INSERT INTO plays(baby_id,play_type,duration_min,play_start,play_end,note,occurred_at) VALUES(?,?,?,?,?,?,?)',
    ).run(baby.id, play_type, duration, play_start, play_end, b?.note ?? null, occurred_at)
    return ok(db.prepare('SELECT * FROM plays WHERE id=?').get(Number(info.lastInsertRowid)))
  })

  fastify.post('/api/plays/list', async (req) => {
    const uid = (req as any).userId as number
    const b = req.body as any
    const baby = getBabyByUser(uid, b?.babyId ? Number(b.babyId) : undefined)
    if (!baby) return ok([])
    const { start, end } = b?.from && b?.to ? rangeFromTo(b.from, b.to) : dateRange(b?.date)
    const rows = db.prepare(
      'SELECT * FROM plays WHERE baby_id=? AND occurred_at >= ? AND occurred_at < ? ORDER BY occurred_at DESC',
    ).all(baby.id, start, end)
    return ok(rows)
  })

  fastify.put('/api/plays/:id', async (req, reply) => {
    const uid = (req as any).userId as number
    const id = Number((req.params as any).id)
    const b = req.body as any
    const baby = getBabyByUser(uid)
    if (!baby) return reply.code(404).send(fail('请先在「我的」中创建宝宝'))
    const row: any = db.prepare('SELECT * FROM plays WHERE id=? AND baby_id=?').get(id, baby.id)
    if (!row) return reply.code(404).send(fail('记录不存在'))
    const sets: string[] = []
    const vals: any[] = []
    if (b?.play_type !== undefined) {
      const t = String(b.play_type)
      if (!t) return reply.code(400).send(fail('请填写娱乐类型'))
      sets.push('play_type=?')
      vals.push(t)
    }
    // 若传了 play_start / play_end，优先用它们算 duration_min
    const play_start = b?.play_start !== undefined ? String(b.play_start) : undefined
    const play_end = b?.play_end !== undefined ? String(b.play_end) : undefined
    if (play_start !== undefined || play_end !== undefined) {
      const ss = play_start !== undefined ? play_start : row.play_start
      const se = play_end !== undefined ? play_end : row.play_end
      if (ss && se) {
        const diffMs = new Date(se).getTime() - new Date(ss).getTime()
        const dur = Math.ceil(diffMs / 60000)
        if (dur <= 0) return reply.code(400).send(fail('结束时间必须晚于开始时间'))
        sets.push('duration_min=?')
        vals.push(dur)
        sets.push('play_start=?')
        vals.push(ss)
        sets.push('play_end=?')
        vals.push(se)
      } else if (ss) {
        sets.push('play_start=?')
        vals.push(ss)
        sets.push('play_end=?')
        vals.push(row.play_end)
        sets.push('duration_min=?')
        vals.push(0)
      }
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
    db.prepare(`UPDATE plays SET ${sets.join(', ')} WHERE id=?`).run(...vals)
    return ok(db.prepare('SELECT * FROM plays WHERE id=?').get(id))
  })

  fastify.delete('/api/plays/:id', async (req, reply) => {
    const uid = (req as any).userId as number
    const id = Number((req.params as any).id)
    const baby = getBabyByUser(uid)
    if (!baby) return reply.code(404).send(fail('请先在「我的」中创建宝宝'))
    const row = db.prepare('SELECT * FROM plays WHERE id=? AND baby_id=?').get(id, baby.id)
    if (!row) return reply.code(404).send(fail('记录不存在'))
    db.prepare('DELETE FROM plays WHERE id=?').run(id)
    return ok({ id })
  })
}

export default playRoutes
