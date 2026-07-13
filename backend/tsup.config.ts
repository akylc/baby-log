import { defineConfig } from 'tsup'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

// 读取仓库根 package.json 的 version 作为唯一版本来源，
// 注入后端构建产物（与前端 VITE_APP_VERSION 同源），用于前后端版本握手校验。
const rootPkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf-8'),
)

export default defineConfig({
  entry: { server: 'src/server.ts' },
  format: ['cjs'],
  // 目标必须 >= node22：node:sqlite 在 node18 目标下不被 esbuild 识别为内置模块，
  // 会被剥离 `node:` 前缀变成 require("sqlite") 导致运行时找不到模块；node22 下则正确保留。
  target: 'node22',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // 把除 node: 内置模块外的所有 npm 运行时依赖打包进 dist，使其自包含、可直接 node dist/server.js 运行。
  // 注意：不能用 [/.*/] 强制打包一切，否则会把 node:sqlite 也尝试打包并剥离 `node:` 前缀，
  // 变成 require("sqlite")（不存在的包）。用负向前瞻排除 node: 内置模块，让 esbuild 按内置模块
  // 外置并保留 node: 前缀（如 require("node:sqlite")）。
  noExternal: [/(?!node:)/],
  // 构建时注入后端版本号（与前端 VITE_APP_VERSION 同源：根 package.json version），
  // 用于 /api 业务路由的版本握手校验。esbuild 会把 `process.env.APP_VERSION` 字面量直接替换为字符串。
  define: {
    'process.env.APP_VERSION': JSON.stringify(rootPkg.version),
  },
  // 构建完成后把前端产物复制到 dist/public，保证 dist 完整自包含、可跨平台直接部署
  onSuccess: 'node ./scripts/copy-frontend.mjs',
})
