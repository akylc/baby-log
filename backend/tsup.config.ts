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
  // node:sqlite 是 Node 内置模块，标记 external 即可（无需打包、无需复制原生二进制，天然跨平台）
  external: ['node:sqlite'],
  // 构建完成后把前端产物复制到 dist/public，保证 dist 完整自包含、可跨平台直接部署
  onSuccess: 'node ./scripts/copy-frontend.mjs',
})
