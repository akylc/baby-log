import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
  build: {
    // 前端构建产物输出到自身 dist/，再由后端 tsup 的 onSuccess 复制到 backend/dist/public，
    // 使后端打包产物（backend/dist）完全自包含、可直接部署运行。
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
    // 目标定为 es2022：现代浏览器原生支持解构等语法，避免 esbuild 在较高版本下
    // 尝试降级旧语法时报 "Transforming destructuring is not supported yet"。
    target: 'es2022',
  },
})
