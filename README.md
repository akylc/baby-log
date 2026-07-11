# 时光簿 / MomentLog

时间点事件记录应用。以「主题」归集事件，以「类型化记录」结构化保存同一时刻的多维信息。

## 技术栈（依据 PRD v0.6）

- **前端**：Vite + Vue 3 + TypeScript + Vue Router + Pinia + Naive UI（响应式，移动/桌面自适应）
- **后端**：Fastify + TypeScript + better-sqlite3，使用 **tsup** 打包
- **包管理**：pnpm workspace 单体仓库（monorepo），`backend/` 与 `frontend/` 两个子包
- **部署**：前后端共用同一端口（默认 `:3000`）；前端 `vite build` 产物输出到后端 `public/`，由 Fastify 单端口托管（SPA history 回退）
- **接口约定**：所有**数据接口一律 POST**；`GET` 仅用于前端页面与静态资源

## 目录

```
.
├── package.json          # 根：workspace 入口
├── pnpm-workspace.yaml
├── backend/              # Fastify + TS + SQLite3（tsup 打包）
└── frontend/             # Vite + Vue3 + TS（构建产物输出到 backend/public）
```

## 常用命令

```bash
pnpm install            # 安装全部依赖（根目录一次装齐）

pnpm dev                # 开发：前后端同时启动（前端 5173 + 后端 3000，前端代理 /api）
pnpm build              # 生产构建：先构建前端到 backend/public，再用 tsup 打包后端
pnpm start              # 以单端口运行后端（托管前端 + 提供接口），默认 http://localhost:3000
```

## 数据模型

`用户 1—N 主题`，`主题 1—N 事件`，`主题 1—N 标签`，`事件 1—N 记录`，`记录 N—N 标签`。

MVP 默认 `user_id = 1`（服务端按多用户架构设计，预留鉴权）。
