// 在 pnpm dev / build / start 之前自动确保 better-sqlite3 原生模块
// 与「当前运行命令的 Node」ABI 匹配，避免换 Node 版本或重装
// node_modules 后 better-sqlite3 的 .node 与运行时 Node 不兼容导致 dlopen 崩溃。
// 逻辑：先尝试加载，已兼容则跳过（秒过）；加载失败再自动重编。
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backend = join(__dirname, '..', 'backend');
const target = join(backend, 'node_modules', 'better-sqlite3');
const node = process.execPath;

const log = (m) => console.log('[rebuild-native] ' + m);

if (!existsSync(target)) {
  log('better-sqlite3 未安装，跳过（请先执行 pnpm install）');
  process.exit(0);
}

// 已兼容当前 Node ABI 则跳过编译，避免每次启动都重编
try {
  execSync('node -e "require(\'better-sqlite3\')"', { cwd: backend, stdio: 'ignore' });
  log('已兼容 Node ' + process.version + '，跳过重建');
  process.exit(0);
} catch {
  // 需要重建
}

log('为 Node ' + process.version + ' 重建 better-sqlite3 原生模块…');
try {
  execSync('npm rebuild better-sqlite3', { cwd: backend, stdio: 'inherit' });
  log('构建成功 ✅');
} catch {
  log('npm rebuild 未生效，改用 node-gyp 源码编译…');
  const nodeDir = dirname(dirname(node));
  const gypPath = join(
    nodeDir,
    'lib',
    'node_modules',
    'npm',
    'node_modules',
    'node-gyp',
    'bin',
    'node-gyp.js'
  );
  try {
    if (!existsSync(gypPath)) throw new Error('node-gyp not found at ' + gypPath);
    execSync(`"${node}" "${gypPath}" rebuild --release`, { cwd: target, stdio: 'inherit' });
    log('node-gyp 构建成功 ✅');
  } catch {
    console.warn('[rebuild-native] ⚠️ 自动构建失败，请手动重建：');
    console.warn(`  cd ${target} && ${node} <node-gyp路径> rebuild --release`);
  }
}
