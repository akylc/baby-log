# ---- 运行阶段：仅使用外部已打包的自包含产物 backend/dist ----
# 构建（pnpm install && pnpm build）在宿主机或 CI 完成，
# 这里只把纯 JS 的 backend/dist 复制进镜像，无需任何原生编译/依赖安装。
FROM node:24-alpine

# 版本单一数据源 = 仓库根 package.json 的 version。
# - APP_VERSION：tsup 构建 dist 时已把 package.json 的 version 内联进 server.js（见 backend/tsup.config.ts
#   的 define），运行期不再依赖任何环境变量；因此 Docker 层**不设** APP_VERSION（已移除 ENV APP_VERSION=$VERSION）。
# - LABEL version：通过 --build-arg VERSION 传入，由 pnpm docker:build（scripts/build-docker.mjs）
#   自动读取根 package.json 的 version 注入，保证镜像标签与代码版本一致。直接 docker build 不带
#   --build-arg 也能成功，但 LABEL version 会为空——请始终用 pnpm docker:build。
# （构建上下文刻意精简，package.json 被 .dockerignore 排除，故版本不在 Dockerfile 内读取，而由构建脚本传入。）
ARG VERSION
LABEL version=$VERSION

WORKDIR /app

# server.js 已通过 tsup 内联所有运行时依赖；
# node:sqlite 随 Node 24 内置，无需 npm install；前端静态产物在 dist/public。
COPY backend/dist ./dist

# 数据库(/app/data/momentlog.db)需持久化，
# 声明为卷，运行时用 -v 挂载到宿主机，否则容器删除后数据丢失。
RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 26712
ENV HOST=0.0.0.0 PORT=26712
CMD ["node", "dist/server.js"]
