import path from 'node:path'
import fs from 'node:fs'

// 以「运行目录 = backend 根目录」为基准，保证 dev(tsx) 与 prod(dist) 行为一致
const cwd = process.cwd()

export const ROOT = cwd
export const PUBLIC_DIR = path.join(cwd, 'public') // 前端 vite build 产物目录
export const UPLOAD_DIR = path.join(cwd, 'uploads') // 图片上传目录（对外 /uploads 访问）
export const DATA_DIR = path.join(cwd, 'data') // SQLite 数据库目录

fs.mkdirSync(PUBLIC_DIR, { recursive: true })
fs.mkdirSync(UPLOAD_DIR, { recursive: true })
fs.mkdirSync(DATA_DIR, { recursive: true })

export const config = {
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  dbPath: path.join(DATA_DIR, 'momentlog.db'),
}
