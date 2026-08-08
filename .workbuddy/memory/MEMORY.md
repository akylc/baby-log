# 项目长期记忆 — MomentLog (时光簿)

## 依赖 / 构建（关键坑）
- `node:sqlite` (DatabaseSync) 已替代 better-sqlite3，`backend/dist` 纯 JS 自包含。
- ⚠️ 环境陷阱：全局 `NODE_OPTIONS=--require=...` shim（命令空输出+exit1 先试 `NODE_OPTIONS=` 前缀）+ pnpm 11 MSYS 路径 bug（用 `node .../pnpm.mjs <cmd>` 直接调）；`.npmrc` 固化 `node-linker=hoisted`。
- node:sqlite 打包：源码 `require('node:sqlite')` 保留 `node:` 前缀；tsup `noExternal` 排除 node: + target node22；vite `build.target:'es2022'`。
- 构建产物：前端 vite build → tsup onSuccess 复制 `frontend/dist` 到 `backend/dist/public`。
- ⚠️ SFC 闭合坑：Edit 整段替换以 `</style>`/`</script>`/`</template>` 结尾的块若漏闭合标签 → vite 报 `Element is missing end tag`。整段替换务必确认闭合标签在。
- ⚠️ 路径 cwd 无关：`DATA_DIR/PUBLIC_DIR` 用 `__dirname`（构建后 `backend/dist`），本地恒 `backend/data` 与 `backend/dist/public`，canon 库=`backend/data/momentlog.db`。
- Docker：根 Dockerfile 多阶段 node:24-alpine，仅 COPY `backend/dist`。

## 数据模型
- 三表平行：feedings（含 breast/bottle/water/supplement/food/pee/poop 等）+ sleeps + plays，各独立表+路由，不塞进 feedings。
- 娱乐=睡眠平行复制（开始/结束时间选填，有结束才有时长）；各类型有 `--t-*` 与 `.tl-{type}`。

## 本地预览 / 运行
- 起预览首选根 `pnpm dev`（concurrently 起前端 5173+后端，predev 自动杀旧进程）。
- 后端手动长进程 `node dist/server.js`，不热更；改码须 `pnpm build` 再重启。
- ⚠️ 杀旧后端须 PowerShell `Stop-Process -Id <PID> -Force`（沙箱 kill 无效）。
- vite 探活 curl 须 `--noproxy '*'`；升版本后须重启前端 dev server（VITE_APP_VERSION 在 dev server 启动时固化）。

## git 提交习惯
- 验收 OK 才 `git commit`，信息 `type: 中文描述`；不主动推送除非显式指令。
- 例外：项目记忆 `MEMORY.md` 主动提交；每日日记 `YYYY-MM-DD.md` 已被 .gitignore 排除不入库。

## 发版 / Docker 打包（固定流程，一气呵成）
① 升版本号：根 package.json 抬 patch，frontend/backend 同步改。
② `pnpm build`：版本内联前后端 dist（前端 VITE_APP_VERSION / 后端 APP_VERSION）。
③ `pnpm docker:build`（scripts/build-docker.mjs）：读根版本以 `baby-log:v<版本>` 构建（node:24-alpine COPY backend/dist），`docker save` 导出 tar（env `DOCKER_TAR_DIR` 覆盖路径）。**导出后自动清除旧版镜像**：删 `baby-log:*` 非当前 tag（被运行容器引用仅 warn 跳过）+ `docker image prune -f`。
  - ⚠️ 共享盘用正斜杠 UNC `//10.8.0.10/151XXXX0858/应用/Docker/baby-log`（反斜杠会被 shell 折叠致 invalid output path）。docker:build 须 `DOCKER_BUILDKIT=0`：buildx 的 `~/.docker/buildx/.lock` 被 Defender 拦 Access Denied，经典构建器绕过；Docker Desktop 已装，守护未起先启动它再 build。
④ 提交推送+打 tag：add 全部（三处 package.json+代码+MEMORY.md）→ `git commit`（chore: 版本号升至 vX.Y.Z）→ `git tag v<版本>` → 双推 origin+github 代码与 tag。
- 版本唯一来源=根 package.json；Docker 镜像无 version LABEL，以 tag 与 `/api/health` 为准。禁裸 `docker build`。
- 部署：`docker load -i <tar>` → `docker run -d -p 26712:26712 -v <data>:/app/data baby-log:v<版本>`；健康检查 `GET /api/health`。
- GitHub：origin+github 双推（`git@github.com:akylc/baby-log.git` 私有）。

## 首页列表「分组折叠」（已实现，2026-07-29）
- 开关：「我的」(Baby.vue)「分组查看记录」`n-switch` 默认开，经 `groupedView.ts`（持久化 localStorage `ml-grouped-view`，仅显式 '0' 才关）跨页共享。开→按类型折叠，关→原按日平铺。
- 分组键：`groupKey` 把 care 类(bath/haircut/nails)合并为 `care`；`groupedDays` 在 `dayGroups` 上叠 `typeGroups`，按组内最新 `sortKey` 降序。
- 折叠态：组头=`.tl-item`（最新一条 title/sub+距现在·距上次 gap+时间）+ 内叠双 `.tg-stack.s1/.s2` 假卡（s2 更淡、层级 head(2)>s1(1)>s2(0)）。单条平铺。
- 展开态：顶部「收起卡」`.tl-collapse`（无时间，"类型 · 共 N 条"）收起；其下各条带时间点击编辑。
- 动画已撤回，现 `<template v-if/v-else>` 直接切换无动画。
