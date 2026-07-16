import path from 'node:path'
import fs from 'node:fs'

// 路径以「本模块所在目录」为基准，而非 process.cwd()，
// 避免从不同目录启动后端（如 `node backend/dist/server.js` 在仓库根 vs backend/ 下）
// 连接到不同的数据库 / 静态目录，导致账号「消失」、登录失败。
// 构建后本文件被打包进 backend/dist/server.js（__dirname = backend/dist），
// dev(tsx) 下则为 backend/src；两者都解析到 backend/data 与 backend/dist/public，行为一致。
// 容器内 WORKDIR=/app、server 位于 /app/dist/server.js，同样解析到 /app/data，与挂载卷一致。
declare const __dirname: string
const here = __dirname

export const ROOT = here
export const PUBLIC_DIR = path.resolve(here, 'public') // 前端产物：backend/dist/public（本地） / /app/dist/public（docker）
export const DATA_DIR = path.resolve(here, '../data') // 数据库目录：backend/data（本地） / /app/data（docker）

fs.mkdirSync(PUBLIC_DIR, { recursive: true })
fs.mkdirSync(DATA_DIR, { recursive: true })

export const config = {
  port: Number(process.env.PORT) || 26712,
  host: process.env.HOST || '0.0.0.0',
  dbPath: path.join(DATA_DIR, 'momentlog.db'),
  jwtSecret: process.env.JWT_SECRET || 'momentlog-dev-secret-change-me',
}
