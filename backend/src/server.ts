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
import playRoutes from './routes/plays'
import statsRoutes from './routes/stats'
import healthRoutes from './routes/health'

declare module 'fastify' {
  interface FastifyRequest {
    userId?: number
  }
}

// 后端版本号：构建时由 tsup define 注入（与前端 VITE_APP_VERSION 同源：根 package.json version）
const APP_VERSION = process.env.APP_VERSION || '0.0.0'

// 静态资源缓存策略：
// - HTML（index.html 及 SPA 回退页）禁止缓存，保证发版后用户始终拿到最新页面；
// - 其余静态资源（JS/CSS/图片/字体等，通常是带 hash 的文件名）长缓存 + immutable，减少重复请求。
function setCacheHeaders(res: any, filePath: string) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.html') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
  } else {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  }
}

// 简单语义化版本比较：a<b 返回 -1，a===b 返回 0，a>b 返回 1
function cmpVersion(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0)
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0
    const y = pb[i] || 0
    if (x !== y) return x < y ? -1 : 1
  }
  return 0
}

const fastify = Fastify({ logger: true })

// 鉴权前置钩子：除 /api/auth/ 与 /api/health 外的所有 /api 请求需携带有效 token
fastify.addHook('preHandler', async (req, reply) => {
  const url = req.url
  if (
    url.startsWith('/api/') &&
    !url.startsWith('/api/auth/') &&
    !url.startsWith('/api/health')
  ) {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    const payload = verifyToken(token)
    if (!payload?.uid) return reply.code(401).send({ code: 1, message: '未登录或登录已过期' })
    req.userId = payload.uid
  }
})

// 版本握手校验：除 /api/auth/ 与 /api/health 外的所有 /api 业务请求，
// 前端须携带 X-App-Version 头；与后端版本不一致则拒绝返回数据（code:2），
// 提示前端「当前版本过低，请刷新」，避免项目更新后前后端数据不一致。
fastify.addHook('preHandler', async (req, reply) => {
  const url = req.url
  if (
    url.startsWith('/api/') &&
    !url.startsWith('/api/auth/') &&
    !url.startsWith('/api/health')
  ) {
    const clientVersion = (req.headers['x-app-version'] as string) || ''
    // 仅当「前端版本低于后端」时拒绝并提示刷新（用户停留在旧前端，需加载新版本）；
    // 前端版本 >= 后端（如前端先发版、后端尚未重启）一律放行，避免误报「当前版本过低」。
    if (clientVersion && cmpVersion(clientVersion, APP_VERSION) < 0) {
      return reply.code(200).send({
        code: 2,
        message: '当前版本过低，请刷新页面',
        data: { serverVersion: APP_VERSION, clientVersion },
      })
    }
  }
})

async function main() {
  // 前端构建产物：根路径托管
  await fastify.register(fastifyStatic, {
    root: PUBLIC_DIR,
    prefix: '/',
    wildcard: false,
    index: 'index.html',
    setHeaders: setCacheHeaders,
  })

  // 业务路由
  await fastify.register(authRoutes)
  await fastify.register(babyRoutes)
  await fastify.register(feedingRoutes)
  await fastify.register(sleepRoutes)
  await fastify.register(diaperRoutes)
  await fastify.register(playRoutes)
  await fastify.register(statsRoutes)
  await fastify.register(healthRoutes)

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
    console.log(`喂养记录 服务已启动: http://localhost:${config.port}`)
  } catch (e) {
    fastify.log.error(e)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
