import type { FastifyInstance } from 'fastify'
import fs from 'node:fs'
import path from 'node:path'
import { UPLOAD_DIR } from '../config'
import { ok, failBody } from '../lib/reply'

export default async function uploadRoutes(fastify: FastifyInstance) {
  // 上传图片到服务端 uploads/ 目录，返回可访问 URL
  fastify.post('/api/upload', async (req, reply) => {
    const data = await req.file()
    if (!data) return reply.code(400).send(failBody('未收到文件'))

    const ext = path.extname(data.filename) || ''
    const year = String(new Date().getFullYear())
    const dir = path.join(UPLOAD_DIR, year)
    fs.mkdirSync(dir, { recursive: true })

    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    const filepath = path.join(dir, filename)
    await data.file.pipe(fs.createWriteStream(filepath))

    const url = `/uploads/${year}/${filename}`
    return ok({ url })
  })
}
