// 把前端 vite 构建产物复制到后端 dist/public，使打包产物（backend/dist）自包含，
// 可直接拷贝部署并运行 `node dist/server.js`，无需额外准备 public 目录。
//
// 说明：后端 tsup 配置 clean:true 会清空 backend/dist，因此前端产物必须在 tsup 构建
// 完成后（onSuccess）再复制进来，而不是在构建之前放到 dist/public。
import { cpSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// 该脚本由 tsup onSuccess 触发，运行目录 = backend
const src = join(process.cwd(), '..', 'frontend', 'dist')
const dest = join(process.cwd(), 'dist', 'public')

if (!existsSync(src)) {
  console.error(`[copy-frontend] 未找到前端构建产物: ${src}\n请先执行 pnpm --filter frontend build`)
  process.exit(1)
}

mkdirSync(dest, { recursive: true })
cpSync(src, dest, { recursive: true, dereference: true })
console.log(`[copy-frontend] 已复制前端产物 -> ${dest}`)
