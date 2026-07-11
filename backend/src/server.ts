import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import path from 'node:path'
import fs from 'node:fs'
import { PUBLIC_DIR, config } from './config'
import './db' // 初始化数据库（建表）
import { verifyToken } from './auth'
import authRoutes from './routes/auth'
import babyRoutes from './routes/baby'
import feedingRoutes from './routes/feedings'
import sleepRoutes from './routes/sleeps'
import diaperRoutes from './routes/diapers'
import statsRoutes from './routes/stats'

declare module 'fastify' {
  interface FastifyRequest {
    userId?: number
  }
}

const fastify = Fastify({ logger: true })

// 鉴权前置钩子：除 /api/auth/ 外的所有 /api 请求需携带有效 token
fastify.addHook('preHandler', async (req, reply) => {
  const url = req.url
  if (url.startsWith('/api/') && !url.startsWith('/api/auth/')) {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    const payload = verifyToken(token)
    if (!payload?.uid) return reply.code(401).send({ code: 1, message: '未登录或登录已过期' })
    req.userId = payload.uid
  }
})

// 前端构建产物：根路径托管
await fastify.register(fastifyStatic, {
  root: PUBLIC_DIR,
  prefix: '/',
  wildcard: false,
  index: 'index.html',
})

// 业务路由
await fastify.register(authRoutes)
await fastify.register(babyRoutes)
await fastify.register(feedingRoutes)
await fastify.register(sleepRoutes)
await fastify.register(diaperRoutes)
await fastify.register(statsRoutes)

// SPA history 回退：文件存在则发文件，否则回退到 index.html
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
