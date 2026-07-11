import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { server: 'src/server.ts' },
  format: ['cjs'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // 把除原生模块外的所有运行时依赖打包进 dist，使其自包含、可直接 node dist/server.js 运行
  noExternal: [/.*/],
  // better-sqlite3 是原生模块（含预编译 .node），不参与 JS 打包，构建后复制到 dist/node_modules
  external: ['better-sqlite3'],
  // 构建完成后：复制 better-sqlite3 原生包 + 前端产物到 dist，保证 dist 完整自包含
  onSuccess: 'node ./scripts/copy-native.mjs && node ./scripts/copy-frontend.mjs',
})
