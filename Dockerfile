# ---- 构建阶段：安装依赖并打包前后端，产出自包含的 backend/dist ----
FROM node:24-alpine AS build
WORKDIR /app

# 启用仓库约定的 pnpm
RUN corepack enable

# 先复制依赖清单，利用 Docker 层缓存
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc* ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN pnpm install

# 复制全部源码并构建
# 产物 backend/dist 已自包含：依赖经 tsup 内联进 server.js，前端静态在 dist/public
COPY . .
RUN pnpm build

# ---- 运行阶段：仅需纯 JS 的 backend/dist，无需任何原生编译 ----
FROM node:24-alpine AS runtime
WORKDIR /app

# server.js 已内联所有运行时依赖；node:sqlite 随 Node 24 内置，无需 npm install
COPY --from=build /app/backend/dist ./dist
# 数据/上传目录运行时由应用自动创建，这里建好占位以便挂载卷
RUN mkdir -p /app/data /app/uploads

EXPOSE 3000
ENV HOST=0.0.0.0 PORT=3000
CMD ["node", "dist/server.js"]
