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

export default async function recordsRoutes(fastify: FastifyInstance) {
  const uid = getUserId()

  // 添加记录
  fastify.post('/api/events/records/create', async (req, reply) => {
    const b = req.body as any
    if (!b?.eventId || !b?.typeId || b?.payload === undefined)
      return reply.code(400).send(failBody('eventId/typeId/payload 必填'))
    const event = db
      .prepare('SELECT e.id FROM events e JOIN topics t ON t.id=e.topic_id WHERE e.id=? AND t.user_id=?')
      .get(b.eventId, uid)
    if (!event) return reply.code(404).send(failBody('事件不存在'))
    const typeOk = db.prepare('SELECT id FROM record_types WHERE id=?').get(b.typeId)
    if (!typeOk) return reply.code(400).send(failBody('记录类型不存在'))

    const payload = typeof b.payload === 'string' ? b.payload : JSON.stringify(b.payload)
    const info = db.prepare('INSERT INTO records(event_id, type_id, payload) VALUES(?, ?, ?)').run(b.eventId, b.typeId, payload)
    const rid = Number(info.lastInsertRowid)

    const tags = Array.isArray(b?.tags) ? b.tags.map(Number).filter(Boolean) : []
    if (tags.length) {
      const ins = db.prepare('INSERT OR IGNORE INTO record_tags(record_id, tag_id) VALUES(?, ?)')
      const tx = db.transaction((ids: number[]) => {
        for (const tid of ids) ins.run(rid, tid)
      })
      tx(tags)
    }
    return ok({ id: rid })
  })

  // 编辑记录（可同步标签）
  fastify.post('/api/records/update', async (req, reply) => {
    const b = req.body as any
    if (!b?.id) return reply.code(400).send(failBody('id 必填'))
    const exists = db
      .prepare(
        'SELECT r.id FROM records r JOIN events e ON e.id=r.event_id JOIN topics t ON t.id=e.topic_id WHERE r.id=? AND t.user_id=?',
      )
      .get(b.id, uid)
    if (!exists) return reply.code(404).send(failBody('记录不存在'))

    if (b?.payload !== undefined) {
      const payload = typeof b.payload === 'string' ? b.payload : JSON.stringify(b.payload)
      db.prepare('UPDATE records SET payload=?, updated_at=datetime(\'now\') WHERE id=?').run(payload, b.id)
    }
    if (Array.isArray(b?.tags)) {
      const tags = b.tags.map(Number).filter(Boolean)
      const tx = db.transaction((ids: number[]) => {
        db.prepare('DELETE FROM record_tags WHERE record_id=?').run(b.id)
        const ins = db.prepare('INSERT OR IGNORE INTO record_tags(record_id, tag_id) VALUES(?, ?)')
        for (const tid of ids) ins.run(b.id, tid)
      })
      tx(tags)
    }
    return ok({ id: b.id, tags: getRecordTags(b.id) })
  })

  // 删除记录（级联删标签关联）
  fastify.post('/api/records/delete', async (req, reply) => {
    const b = req.body as any
    const info = db
      .prepare(
        `DELETE FROM records WHERE id IN (
          SELECT r.id FROM records r JOIN events e ON e.id=r.event_id JOIN topics t ON t.id=e.topic_id
          WHERE r.id=? AND t.user_id=?
        )`,
      )
      .run(b?.id, uid)
    if (info.changes === 0) return reply.code(404).send(failBody('记录不存在'))
    return ok({ id: b.id })
  })
}
