import { FastifyPluginAsync } from 'fastify'
import { db } from '../db'
import { getBabyByUser } from '../helpers'
import { ok, fail } from '../reply'

// 本地今天（yyyy-MM-dd）字符串；生日格式同为 yyyy-MM-dd，按字典序比较即可判断早晚
function todayStr(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
// 生日不可晚于今天
function checkBirthday(birthday: unknown): string | null {
  if (typeof birthday !== 'string' || !birthday) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) return '生日格式不正确'
  if (birthday > todayStr()) return '生日不能晚于今天'
  return null
}

const babyRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/babies', async (req) => {
    const uid = (req as any).userId as number
    return ok(db.prepare('SELECT * FROM babies WHERE user_id=? ORDER BY id ASC').all(uid))
  })

  // 新增宝宝（不再做 upsert 覆盖，支持多宝宝）
  fastify.post('/api/baby', async (req, reply) => {
    const uid = (req as any).userId as number
    const b = req.body as any
    const name = String(b?.name || '').trim()
    if (!name) return reply.code(400).send(fail('请填写宝宝名字'))
    const bdErr = checkBirthday(b?.birthday)
    if (bdErr) return reply.code(400).send(fail(bdErr))
    const info = db.prepare('INSERT INTO babies(user_id, name, birthday, gender) VALUES(?,?,?,?)')
      .run(uid, name, b?.birthday ?? null, b?.gender ?? 'unknown')
    return ok(db.prepare('SELECT * FROM babies WHERE id=?').get(Number(info.lastInsertRowid)))
  })

  fastify.put('/api/baby/:id', async (req, reply) => {
    const uid = (req as any).userId as number
    const id = Number((req.params as any).id)
    const b = req.body as any
    const existing = db.prepare('SELECT * FROM babies WHERE id=? AND user_id=?').get(id, uid) as any
    if (!existing) return reply.code(404).send(fail('宝宝不存在'))
    const name = b?.name !== undefined ? String(b.name || '').trim() : existing.name
    if (!name) return reply.code(400).send(fail('请填写宝宝名字'))
    const bdErr = checkBirthday(b?.birthday)
    if (bdErr) return reply.code(400).send(fail(bdErr))
    db.prepare('UPDATE babies SET name=?, birthday=?, gender=? WHERE id=? AND user_id=?')
      .run(name, b?.birthday ?? existing.birthday, b?.gender ?? existing.gender, id, uid)
    return ok(db.prepare('SELECT * FROM babies WHERE id=?').get(id))
  })

  fastify.delete('/api/baby/:id', async (req, reply) => {
    const uid = (req as any).userId as number
    const id = Number((req.params as any).id)
    const existing = db.prepare('SELECT * FROM babies WHERE id=? AND user_id=?').get(id, uid) as any
    if (!existing) return reply.code(404).send(fail('宝宝不存在'))
    // 记录随外键 ON DELETE CASCADE 自动删除
    db.prepare('DELETE FROM babies WHERE id=? AND user_id=?').run(id, uid)
    return ok({ id })
  })
}

export default babyRoutes
