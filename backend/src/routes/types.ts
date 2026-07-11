import type { FastifyInstance } from 'fastify'
import { db } from '../db/index'
import { ok, failBody } from '../lib/reply'

export default async function typesRoutes(fastify: FastifyInstance) {
  // 记录类型列表
  fastify.post('/api/types/list', async () => {
    const rows = db.prepare('SELECT * FROM record_types ORDER BY id').all()
    return ok(rows)
  })

  // （进阶）新增自定义类型
  fastify.post('/api/types/create', async (req, reply) => {
    const b = req.body as any
    if (!b?.key || !b?.label) return reply.code(400).send(failBody('key/label 必填'))
    try {
      const info = db
        .prepare('INSERT INTO record_types(key, label, icon, schema) VALUES(?, ?, ?, ?)')
        .run(b.key, b.label, b.icon ?? null, b.schema ?? null)
      return ok({ id: Number(info.lastInsertRowid) })
    } catch (e: any) {
      if (String(e.message).includes('UNIQUE')) return reply.code(409).send(failBody('类型 key 已存在'))
      return reply.code(500).send(failBody('创建失败'))
    }
  })
}
