import type { FastifyInstance } from 'fastify'
import { db, getUserId } from '../db/index'
import { ok, failBody } from '../lib/reply'

export default async function topicsRoutes(fastify: FastifyInstance) {
  const uid = getUserId()

  // 主题列表（含事件数）
  fastify.post('/api/topics/list', async () => {
    const rows = db
      .prepare(
        `SELECT t.*, (SELECT COUNT(*) FROM events e WHERE e.topic_id=t.id) AS event_count
         FROM topics t WHERE t.user_id=? ORDER BY t.created_at DESC`,
      )
      .all(uid)
    return ok(rows)
  })

  // 创建主题
  fastify.post('/api/topics/create', async (req, reply) => {
    const b = req.body as any
    if (!b?.name) return reply.code(400).send(failBody('name 必填'))
    const info = db
      .prepare('INSERT INTO topics(user_id, name, icon, note) VALUES(?, ?, ?, ?)')
      .run(uid, String(b.name), b.icon ?? null, b.note ?? null)
    return ok({ id: Number(info.lastInsertRowid) })
  })

  // 主题详情
  fastify.post('/api/topics/detail', async (req, reply) => {
    const b = req.body as any
    const row = db.prepare('SELECT * FROM topics WHERE id=? AND user_id=?').get(b?.id, uid)
    if (!row) return reply.code(404).send(failBody('主题不存在'))
    return ok(row)
  })

  // 编辑主题
  fastify.post('/api/topics/update', async (req, reply) => {
    const b = req.body as any
    if (!b?.id) return reply.code(400).send(failBody('id 必填'))
    const info = db
      .prepare(
        `UPDATE topics SET name=COALESCE(?, name), icon=COALESCE(?, icon), note=COALESCE(?, note), updated_at=datetime('now')
         WHERE id=? AND user_id=?`,
      )
      .run(b.name ?? null, b.icon ?? null, b.note ?? null, b.id, uid)
    if (info.changes === 0) return reply.code(404).send(failBody('主题不存在'))
    return ok({ id: b.id })
  })

  // 删除主题（级联删事件与记录）
  fastify.post('/api/topics/delete', async (req, reply) => {
    const b = req.body as any
    const info = db.prepare('DELETE FROM topics WHERE id=? AND user_id=?').run(b?.id, uid)
    if (info.changes === 0) return reply.code(404).send(failBody('主题不存在'))
    return ok({ id: b.id })
  })

  // 主题标签集合
  fastify.post('/api/topics/tags', async (req) => {
    const b = req.body as any
    const rows = db.prepare('SELECT * FROM topic_tags WHERE topic_id=? ORDER BY id').all(b?.topicId)
    return ok(rows)
  })

  // 新增主题标签
  fastify.post('/api/topics/tags/create', async (req, reply) => {
    const b = req.body as any
    if (!b?.topicId || !b?.name) return reply.code(400).send(failBody('topicId/name 必填'))
    try {
      const info = db
        .prepare('INSERT INTO topic_tags(topic_id, name, color) VALUES(?, ?, ?)')
        .run(b.topicId, String(b.name), b.color ?? null)
      return ok({ id: Number(info.lastInsertRowid) })
    } catch (e: any) {
      if (String(e.message).includes('UNIQUE')) return reply.code(409).send(failBody('该主题下标签名已存在'))
      return reply.code(500).send(failBody('创建失败'))
    }
  })

  // 编辑主题标签
  fastify.post('/api/topics/tags/update', async (req, reply) => {
    const b = req.body as any
    if (!b?.tagId) return reply.code(400).send(failBody('tagId 必填'))
    const info = db
      .prepare('UPDATE topic_tags SET name=COALESCE(?, name), color=COALESCE(?, color) WHERE id=?')
      .run(b.name ?? null, b.color ?? null, b.tagId)
    if (info.changes === 0) return reply.code(404).send(failBody('标签不存在'))
    return ok({ id: b.tagId })
  })

  // 删除主题标签
  fastify.post('/api/topics/tags/delete', async (req, reply) => {
    const b = req.body as any
    const info = db.prepare('DELETE FROM topic_tags WHERE id=?').run(b?.tagId)
    if (info.changes === 0) return reply.code(404).send(failBody('标签不存在'))
    return ok({ id: b.tagId })
  })

  // 主题内检索（按标签 + 关键词）
  fastify.post('/api/topics/search', async (req, reply) => {
    const b = req.body as any
    const topicId = b?.topicId
    const tags = Array.isArray(b?.tags) ? b.tags.map(Number).filter(Boolean) : []
    const match = b?.match === 'all' ? 'all' : 'any'
    const q = b?.q ? `%${b.q}%` : null

    let sql = `SELECT DISTINCT e.* FROM events e WHERE e.topic_id=?`
    const params: any[] = [topicId]
    if (q) {
      sql += ` AND (e.title LIKE ? OR e.note LIKE ?)`
      params.push(q, q)
    }
    if (tags.length) {
      const clauses = tags.map(
        () => `EXISTS (SELECT 1 FROM records r JOIN record_tags rt ON rt.record_id=r.id WHERE r.event_id=e.id AND rt.tag_id=?)`,
      )
      sql += match === 'all' ? ` AND ${clauses.map((c) => `(${c})`).join(' AND ')}` : ` AND (${clauses.join(' OR ')})`
      params.push(...tags)
    }
    sql += ` ORDER BY e.occurred_at DESC`
    const rows = db.prepare(sql).all(...params)
    return ok(rows)
  })
}
