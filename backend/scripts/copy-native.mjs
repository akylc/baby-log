// 把 better-sqlite3 及其运行时子依赖（bindings / prebuild-install 等）复制到 dist/node_modules，
// 并把预编译的 .node 放到 better-sqlite3 的 bindings 模块会探测的确定路径，使 dist 完全自包含：
//   node dist/server.js
//
// 说明：better-sqlite3 内部用 `bindings` 模块定位原生 .node 文件，而 bindings 基于入口模块
// (dist/server.js) 或进程 cwd 向上探测 build/Release，并非基于 better-sqlite3 包自身位置。
// 因此仅把包放进 dist/node_modules 还不够，必须把 .node 也放到探测路径下。
import { cpSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// 解析到包内某文件，如 .../.pnpm/better-sqlite3@X/node_modules/better-sqlite3/lib/index.js
const mainFile = require.resolve('better-sqlite3')

const marker = join('node_modules', 'better-sqlite3')
const idx = mainFile.lastIndexOf(marker)
if (idx === -1) {
  console.error(`[copy-native] 无法定位 better-sqlite3 的 node_modules 目录: ${mainFile}`)
  process.exit(1)
}
// 截取到 .../.pnpm/better-sqlite3@X/node_modules
const srcNodeModules = mainFile.slice(0, idx) + 'node_modules'

const dest = join(process.cwd(), 'dist', 'node_modules')

if (!existsSync(srcNodeModules)) {
  console.error(`[copy-native] 源目录不存在: ${srcNodeModules}`)
  process.exit(1)
}

// 1) 复制 better-sqlite3 运行时依赖（含 build/Release/*.node，dereference 跟随 pnpm 软链）
mkdirSync(dest, { recursive: true })
cpSync(srcNodeModules, dest, { recursive: true, dereference: true })
console.log(`[copy-native] 已复制 better-sqlite3 运行时依赖 -> ${dest}`)

// 2) 把 .node 放到 bindings 会探测的路径（基于入口 dist/server.js 及 cwd=backend）
const nodeSrc = join(dest, 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node')
if (!existsSync(nodeSrc)) {
  console.error(`[copy-native] 未找到预编译 .node: ${nodeSrc}`)
  process.exit(1)
}
const extraTargets = [
  join(process.cwd(), 'dist', 'build', 'Release', 'better_sqlite3.node'), // dist 自包含：从 dist 目录运行时 cwd=dist
  join(process.cwd(), 'build', 'Release', 'better_sqlite3.node'), // 当前习惯：从 backend 目录 node dist/server.js（cwd=backend）
]
for (const t of extraTargets) {
  mkdirSync(dirname(t), { recursive: true })
  cpSync(nodeSrc, t)
  console.log(`[copy-native] 已放置原生模块 -> ${t}`)
}
