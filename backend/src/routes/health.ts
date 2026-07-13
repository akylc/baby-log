import type { FastifyInstance } from 'fastify'
import { createRequire } from 'node:module'

const require = createRequire(__filename)

// 版本号唯一来源：仓库根 package.json 的 version。
// 优先使用镜像注入的环境变量 APP_VERSION（Docker build-arg），
// 否则在开发环境下直接读取根 package.json。
function getAppVersion(): string {
  if (process.env.APP_VERSION) return process.env.APP_VERSION
  try {
    return (require('../../../package.json').version as string) || 'unknown'
  } catch {
    return 'unknown'
  }
}

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/api/health', async () => {
    return {
      status: 'ok',
      version: getAppVersion(),
      time: new Date().toISOString(),
    }
  })
}
