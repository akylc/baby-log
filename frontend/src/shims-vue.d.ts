declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Vite define 注入的全局构建常量（见 vite.config.ts）
declare const __BUILD_TIME__: string
