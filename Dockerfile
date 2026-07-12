# ---- 运行阶段：仅使用外部已打包的自包含产物 backend/dist ----
# 构建（pnpm install && pnpm build）在宿主机或 CI 完成，
# 这里只把纯 JS 的 backend/dist 复制进镜像，无需任何原生编译/依赖安装。
FROM node:24-alpine

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
