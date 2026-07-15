import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'

// 构建时自动生成「打包日期时间」（本地时区，YYYY-MM-DD HH:mm），
// 通过 Vite define 注入为全局常量 __BUILD_TIME__，每次构建自动更新。
function formatBuildTime(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 读取仓库根 package.json 的 version 作为唯一版本来源，注入前端 VITE_APP_VERSION
const rootPkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf-8'),
)

export default defineConfig({
  plugins: [vue()],
  define: {
    __BUILD_TIME__: JSON.stringify(formatBuildTime()),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(rootPkg.version),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // dev 模式下 esbuild 预构建依赖时若按过老的 target（chrome87/es2020 等）会触发
  // "Transforming destructuring is not supported yet" 报错；显式提到 es2022 与现代浏览器对齐。
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2022',
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:26712',
      '/uploads': 'http://localhost:26712',
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
