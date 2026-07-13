// 从根 package.json 读取版本，自动构建并导出 BabyLog Docker 镜像（单一数据源，无需手敲版本号）。
// 用法：
//   pnpm docker:build
//   node scripts/build-docker.mjs
// 镜像标签与 tar 文件名均取自根 package.json 的 version；tar 导出目录可用环境变量 DOCKER_TAR_DIR 覆盖。
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const version = pkg.version
if (!version) {
  console.error('[build-docker] 错误：根 package.json 缺少 version 字段')
  process.exit(1)
}

const image = `baby-log:v${version}`
const tarDir = process.env.DOCKER_TAR_DIR || 'N:/应用/Docker/baby-log'
const tarPath = `${tarDir}/baby-log-v${version}.tar`

console.log(`[build-docker] 读取版本=${version}  镜像=${image}`)
execSync(`docker build --build-arg VERSION=${version} -t ${image} .`, { cwd: root, stdio: 'inherit' })
execSync(`docker save -o "${tarPath}" ${image}`, { stdio: 'inherit' })
console.log(`[build-docker] 完成 -> ${tarPath}`)
