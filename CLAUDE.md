# CLAUDE.md — MomentLog / 时光簿（喂养记录应用）

> 项目上下文初始化文件。改动项目结构/技术栈后请同步更新本文件。

## 项目简介
移动端「美柚风格」宝宝喂养记录应用：记录喂奶（母乳/配方/辅食）、睡眠、尿布等事件，支持时间线查看、按宝宝/类型筛选。前后端单端口托管，纯静态前端 + JSON API。

- 仓库：`ssh://10.8.0.10:3022/AI-Workspace/moment-log.git`
- 包管理：`pnpm@11.11.0`（workspace monorepo）
- Node 要求：`>=22.5`；部署目标 `node:24.15.0`（见 `.node-version`）

## 技术栈
- **前端**：Vite + Vue 3 + TypeScript + Naive UI；别名 `@` → `src/`。
- **后端**：Fastify + TypeScript + **node:sqlite**（Node 内置，无原生依赖）；用 tsup 打包为 CJS。
- 全 POST 接口，统一前缀 `/api`；SPA 由 `@fastify/static` 单端口托管（`dist/public`）。

## 目录结构
```
backend/
  src/
    server.ts        # 入口：启动 Fastify、注册静态/路由、async main()
    config.ts        # 配置（PORT/HOST/dbPath/PUBLIC_DIR=dist/public）
    db/index.ts      # node:sqlite 连接 + 建表 + 迁移   ← 改动最频繁
    routes/          # 各业务路由（auth/baby/feedings/...）
  scripts/copy-frontend.mjs  # 构建后把 frontend/dist 复制到 backend/dist/public
  tsup.config.ts
frontend/
  src/
    views/           # 页面（Record/EventTimeline/...）
    components/      # 抽屉/选择器/类型管理等
    composables/     # useResponsive 等
  vite.config.ts
scripts/stop-if-running.mjs  # 构建/启停前停止占用 3000 端口的后端
Dockerfile / .dockerignore    # 多阶段 node:24-alpine，仅 COPY 纯 JS 的 backend/dist
```

## 常用命令（根目录）
- `pnpm dev`：前后端并行开发（前端 5173 代理到 3000）。
- `pnpm build`：前端 `vite build` → `frontend/dist`，后端 `tsup` → `backend/dist`，再复制前端到 `backend/dist/public`。（`prebuild` 会先停掉运行中的后端释放端口。）
- `pnpm start`：运行 `node backend/dist/server.js`（端口 3000）。开发期改前端后 `vite build` 即时生效，改后端需重新 `tsup` 并重启。

## 部署（Docker）
`backend/dist` 为**完全自包含**的纯 JS 产物（依赖经 tsup 内联进 `server.js`，前端在 `dist/public`，node:sqlite 随 Node 内置）。直接：
```bash
docker build -t momentlog . && docker run -p 3000:3000 -v $(pwd)/data:/app/data momentlog
```
无需在容器内 `npm install` 或编译原生模块，跨平台（Linux/macOS/Windows/Alpine）通用。

## ⚠️ 关键坑（改动前必读）
1. **node:sqlite 必须用 `require('node:sqlite')` 调用引入**（见 `backend/src/db/index.ts`）。tsup 的 `noExternal: [/(?!node:)/]` + `target: 'node22'`。若改回静态 `import { DatabaseSync } from 'node:sqlite'`，esbuild 会剥离 `node:` 前缀变成 `require("sqlite")` → 运行时找不到模块。
2. **`.npmrc` 含 `node-linker=hoisted`**：本机 Windows 无符号链接权限，默认 isolated linker 会导致 `node_modules` 直接依赖缺失。不要删除此行；在 Docker/Linux 上同样兼容。
3. **`frontend/vite.config.ts` 的 `build.target: 'es2022'`** 不能去掉，否则 esbuild 高版本降级解构语法报错 "Transforming destructuring is not supported yet"。
4. **构建/重启前必须停后端**：`prebuild/predev/prestart` 已接 `stop-if-running.mjs`，避免运行中的实例锁住端口导致构建/启动失败。
5. **数据库文件在 `data/`**（如 `data/momentlog.db`），运行时自动创建；开发期清空重建可直接删除该文件。

## Git 约定
- 提交/推送需用户**明确指令**才执行，不主动 commit/push；执行前先说明范围。
- 构建产物（`dist/`、`node_modules/`、`backend/build/`、`*.db` 等）已写入 `.gitignore`，不进版本库。

## 数据模型（当前库）
`users` / `babies` / `feedings` / `sleeps` / `diapers`。`feedings` 已支持左右乳分别记录时长（`left_duration_min` / `right_duration_min`）。全部表带 `created_at` 默认 `datetime('now')`。
