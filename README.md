# 喂养记录（Baby Log）

美柚风格、移动端优先的宝宝日常记录应用：喂养（母乳 / 配方奶 / 辅食 / 瓶喂）、睡眠、换尿布，单宝宝、带简单账号体系，并支持深色模式与记录快速回填。

> 仓库原名 `moment-log`，远程仓库已迁移至 `baby-log`。

## 功能特性

- 账号：用户名注册登录（JWT 风格 token，使用 Node 内置 `crypto` 实现，零第三方依赖）
- 宝宝信息：单宝宝，维护姓名 / 生日 / 性别
- 记录类型：
  - 喂养：母乳（左 / 右乳分别计时）、配方奶、瓶喂（记奶量 ml）、辅食（记食物名）
  - 睡眠：入睡 / 醒来时间、时长
  - 换尿布：尿 / 便 / 尿+便
- 首页今日概览 + 合并时间线（按时间排序，显示「距现在 / 距上次」间隔；睡眠以**醒来时间**为锚点）
- 记录编辑 / 删除（底部抽屉弹层，删除二次确认）
- 历史输入标签：常用输入自动缓存为可点击标签，支持删除
- 深色模式（跟随系统或手动切换）

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | Vue 3 + Vite + Pinia + Vue Router + Naive UI |
| 后端 | Fastify + TypeScript + tsup（打包为 CJS 单文件） |
| 数据库 | Node 24 内置 `node:sqlite`（`DatabaseSync`，零原生依赖） |
| 鉴权 | Node 内置 `crypto`（scrypt 密码哈希 + HMAC 手写 JWT 风格 token） |
| 工程化 | pnpm workspace 单体仓库 |

数据库、密码哈希、令牌签名全部使用 Node 运行时内置能力。生产镜像基于 `node:24-alpine`，**无需 `npm install` 运行时依赖**，也不存在原生模块编译问题。

## 目录结构

```
moment-log/
├── backend/                # Fastify 服务（src 源码，tsup 打包到 dist）
│   ├── src/
│   │   ├── db/             # node:sqlite 初始化与建表
│   │   ├── routes/         # auth / baby / feedings / sleeps / diapers / stats
│   │   ├── helpers.ts      # 鉴权与归属校验
│   │   └── server.ts       # 入口：API + 静态托管（生产托管前端产物）
│   └── public/             # 前端 build 产物（生产由后端单端口托管）
├── frontend/               # Vite + Vue3 源码
│   └── src/views/          # Login / Home / Record / Baby
├── scripts/
│   └── stop-if-running.mjs # 启动前清理占用端口的遗留进程
├── Dockerfile              # 仅拷贝 backend/dist 的极简运行镜像
├── pnpm-workspace.yaml
└── package.json            # dev / build / start 脚本
```

## 环境要求

- **Node.js 24+**（后端使用 `node:sqlite` 内置模块，低版本无法运行）
- pnpm 11（项目 `packageManager` 已声明版本）

## 本地开发

```bash
# 1. 安装依赖
#    pnpm 11 默认不执行依赖的安装脚本，workspace 已放行 esbuild / vue-demi 的构建；
#    better-sqlite3 已不再使用（配置中保留，无害）。
pnpm install

# 2. 启动开发（前端 5173 + 后端 26712 同时启动）
pnpm dev
```

启动后访问：

- 前端（开发服务器）：http://localhost:5173/
- 后端 API：http://localhost:26712/api
- 前端 `/api` 与 `/uploads` 代理已指向 `http://localhost:26712`

> `predev` 钩子会先执行 `scripts/stop-if-running.mjs` 清理 3000 端口的遗留进程。
> 新后端使用 **26712**，若该端口被占用请手动清理：`lsof -ti tcp:26712 | xargs kill -9`。

## 构建与运行（生产）

```bash
# 打包：先构建前端（产物写入 backend/public），再打包后端到 backend/dist
pnpm build

# 单端口运行：Fastify 在 26712 同时托管 API 与前端静态资源（SPA history 回退）
pnpm start
```

### Docker

```bash
pnpm build                 # 在宿主机 / CI 完成依赖安装与打包
docker build -t baby-log .
docker run -d -p 26712:26712 -v $(pwd)/data:/app/data baby-log
```

- 镜像基于 `node:24-alpine`，仅拷贝纯 JS 的 `backend/dist`，无需运行时依赖安装。
- 数据库文件位于容器 `/app/data/momentlog.db`，务必用 `-v` 挂载卷持久化，否则容器删除后数据丢失。

## 配置说明

### npm 镜像源

仓库根 `.npmrc` 默认指向团队私有源 `http://10.8.0.10:4873/`。若该源不可达，`pnpm install` 会失败。可临时用公共源覆盖（**不修改 `.npmrc` 文件**）：

```bash
export npm_config_registry="https://registry.npmmirror.com/"
pnpm install
```

### 端口

- 后端端口由环境变量 `PORT` 控制，默认 `26712`（见 `backend/src/config.ts`）。
- 前端开发代理（`frontend/vite.config.ts`）需与后端端口保持一致。

## API 概览

所有 `/api` 接口（除 `/api/auth/*` 外）需在请求头带 `Authorization: Bearer <token>`。

| 模块 | 路径 |
| --- | --- |
| 鉴权 | `POST /api/auth/register`、`POST /api/auth/login`、`GET /api/auth/me` |
| 宝宝 | `GET /api/baby`、`POST /api/baby` |
| 喂养 | `GET/POST /api/feedings`、`GET /api/feedings/last`、`PUT/DELETE /api/feedings/:id` |
| 睡眠 | `GET/POST /api/sleeps`、`PUT/DELETE /api/sleeps/:id` |
| 换尿布 | `GET/POST /api/diapers`、`PUT/DELETE /api/diapers/:id` |
| 统计 | `GET /api/stats?date=YYYY-MM-DD` |

## 数据模型

SQLite 表：`users`、`babies`、`feedings`、`sleeps`、`diapers`。

- `feedings.type`：`breast`（母乳，左 / 右乳分钟分别存 `left_duration_min` / `right_duration_min`）/ `formula`（配方奶）/ `bottle`（瓶喂，奶量 `amount_ml`）/ `food`（辅食，`food_name`）
- `sleeps`：`sleep_start` / `sleep_end` / `duration_min`
- `diapers.type`：`pee` / `poo` / `both`

## 常见问题

**Q：安装依赖卡在下载 `typescript` / `vite`？**
多为私有源不可达，参见上文「npm 镜像源」用公共源覆盖即可。

**Q：启动报 `EADDRINUSE`？**
26712 被旧进程占用，先 `lsof -ti tcp:26712 | xargs kill -9` 再启动。

**Q：改了源码后页面 / 接口没更新？**
`pnpm start` 运行的是 `backend/dist`（构建产物）。改源码后需重新 `pnpm build`。开发阶段直接用 `pnpm dev` 即可热更新。
