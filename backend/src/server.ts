import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import multipart from '@fastify/multipart'
import path from 'node:path'
import fs from 'node:fs'
import { PUBLIC_DIR, UPLOAD_DIR, config } from './config'
import './db' // 初始化数据库（建表 + 种子）
import topicsRoutes from './routes/topics'
import eventsRoutes from './routes/events'
import recordsRoutes from './routes/records'
import typesRoutes from './routes/types'
import uploadRoutes from './routes/upload'

const fastify = Fastify({ logger: true })

// 1) 图片上传目录：/uploads/* 静态访问
await fastify.register(multipart, { limits: { fileSize: 20 * 1024 * 1024 } })
await fastify.register(fastifyStatic, {
  root: UPLOAD_DIR,
  prefix: '/uploads/',
  decorateReply: false,
})

// 2) 前端构建产物：根路径托管（不注册通配，交由下方回退处理）
await fastify.register(fastifyStatic, {
  root: PUBLIC_DIR,
  prefix: '/',
  wildcard: false,
  index: 'index.html',
})

// 3) 业务路由（全部 POST）
await fastify.register(topicsRoutes)
await fastify.register(eventsRoutes)
await fastify.register(recordsRoutes)
await fastify.register(typesRoutes)
await fastify.register(uploadRoutes)

// 4) SPA history 回退：文件存在则发文件，否则回退到 index.html（GET 仅用于页面/静态资源）
fastify.get('/*', async (req, reply) => {
  const urlPath = String(req.url).split('?')[0]
  const rel = urlPath.replace(/^\//, '')
  const filePath = path.join(PUBLIC_DIR, rel)
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return reply.sendFile(rel)
  }
  const indexFile = path.join(PUBLIC_DIR, 'index.html')
  if (fs.existsSync(indexFile)) return reply.sendFile('index.html')
  return reply.code(404).send({ code: 1, message: 'Not found' })
})

fastify.setErrorHandler((err, req, reply) => {
  fastify.log.error(err)
  reply.code(err.statusCode || 500).send({ code: 1, message: err.message || '服务器错误' })
})

try {
  await fastify.listen({ port: config.port, host: config.host })
  console.log(`MomentLog 服务已启动: http://localhost:${config.port}`)
} catch (e) {
  fastify.log.error(e)
  process.exit(1)
}
