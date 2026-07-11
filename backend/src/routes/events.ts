import type { FastifyInstance } from 'fastify'
import { db, getUserId } from '../db/index'
import { ok, failBody } from '../lib/reply'

function getRecordTags(recordId: number) {
  return db
    .prepare(
      `SELECT tt.* FROM topic_tags tt JOIN record_tags rt ON rt.tag_id=tt.id WHERE rt.record_id=?`,
    )
    .all(recordId)
}

export default async function eventsRoutes(fastify: FastifyInstance) {
  const uid = getUserId()

  // 事件列表（可按主题 / 时间 / 关键词 / 标签筛选）
  fastify.post('/api/events/list', async (req) => {
    const b = req.body as any
    const topicId = b?.topicId ? Number(b.topicId) : null
    const tags = Array.isArray(b?.tags) ? b.tags.map(Number).filter(Boolean) : []
    const match = b?.match === 'all' ? 'all' : 'any'
    const q = b?.q ? `%${b.q}%` : null
    const from = b?.from || null
    const to = b?.to || null

    let sql = `SELECT DISTINCT e.* FROM events e JOIN topics t ON t.id=e.topic_id WHERE t.user_id=?`
    const params: any[] = [uid]
    if (topicId) {
      sql += ` AND e.topic_id=?`
      params.push(topicId)
    }
    if (from) {
      sql += ` AND e.occurred_at >= ?`
      params.push(from)
    }
    if (to) {
      sql += ` AND e.occurred_at <= ?`
      params.push(to)
    }
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

  // 创建事件
  fastify.post('/api/events/create', async (req, reply) => {
    const b = req.body as any
    if (!b?.topicId || !b?.title || !b?.occurred_at)
      return reply.code(400).send(failBody('topicId/title/occurred_at 必填'))
    const owner = db.prepare('SELECT id FROM topics WHERE id=? AND user_id=?').get(b.topicId, uid)
    if (!owner) return reply.code(404).send(failBody('主题不存在'))
    const info = db
      .prepare('INSERT INTO events(topic_id, title, occurred_at, note) VALUES(?, ?, ?, ?)')
      .run(b.topicId, String(b.title), String(b.occurred_at), b.note ?? null)
    return ok({ id: Number(info.lastInsertRowid) })
  })

  // 事件详情（含记录与标签）
  fastify.post('/api/events/detail', async (req, reply) => {
    const b = req.body as any
    const event = db
      .prepare('SELECT e.* FROM events e JOIN topics t ON t.id=e.topic_id WHERE e.id=? AND t.user_id=?')
      .get(b?.id, uid)
    if (!event) return reply.code(404).send(failBody('事件不存在'))
    const records = db.prepare('SELECT * FROM records WHERE event_id=? ORDER BY created_at').all(b.id)
    const enriched = (records as any[]).map((r) => ({ ...r, tags: getRecordTags(r.id) }))
    return ok({ ...(event as any), records: enriched })
  })

  // 编辑事件
  fastify.post('/api/events/update', async (req, reply) => {
    const b = req.body as any
    if (!b?.id) return reply.code(400).send(failBody('id 必填'))
    const info = db
      .prepare(
        `UPDATE events SET title=COALESCE(?, title), occurred_at=COALESCE(?, occurred_at), note=COALESCE(?, note), updated_at=datetime('now')
         WHERE id=? AND topic_id IN (SELECT id FROM topics WHERE user_id=?)`,
      )
      .run(b.title ?? null, b.occurred_at ?? null, b.note ?? null, b.id, uid)
    if (info.changes === 0) return reply.code(404).send(failBody('事件不存在'))
    return ok({ id: b.id })
  })

  // 删除事件（级联删记录）
  fastify.post('/api/events/delete', async (req, reply) => {
    const b = req.body as any
    const info = db
      .prepare('DELETE FROM events WHERE id=? AND topic_id IN (SELECT id FROM topics WHERE user_id=?)')
      .run(b?.id, uid)
    if (info.changes === 0) return reply.code(404).send(failBody('事件不存在'))
    return ok({ id: b.id })
  })

  // 某事件下记录列表
  fastify.post('/api/events/records', async (req, reply) => {
    const b = req.body as any
    const event = db
      .prepare('SELECT e.id FROM events e JOIN topics t ON t.id=e.topic_id WHERE e.id=? AND t.user_id=?')
      .get(b?.eventId, uid)
    if (!event) return reply.code(404).send(failBody('事件不存在'))
    const records = db.prepare('SELECT * FROM records WHERE event_id=? ORDER BY created_at').all(b.eventId)
    const enriched = (records as any[]).map((r) => ({ ...r, tags: getRecordTags(r.id) }))
    return ok(enriched)
  })
}
