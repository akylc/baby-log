import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { server: 'src/server.ts' },
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // 依赖（fastify / better-sqlite3 等）默认作为 external，不打包进产物
})
