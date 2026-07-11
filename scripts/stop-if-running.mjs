// 在 pnpm build / dev / start 等会重建 dist 的操作前，自动停掉占用 3000 端口的
// 后端进程，避免运行中的实例锁住数据库文件或端口，导致 tsup 的 clean 复制失败。
import { execSync } from 'node:child_process'

const PORT = 3000

function findPidOnPort(port) {
  try {
    const out = execSync('netstat -ano', { encoding: 'utf8' })
    for (const line of out.split('\n')) {
      if (line.includes(`:${port}`) && line.includes('LISTENING')) {
        const cols = line.trim().split(/\s+/)
        const pid = cols[cols.length - 1]
        if (pid && /^\d+$/.test(pid)) return pid
      }
    }
  } catch {
    // netstat 不可用时忽略
  }
  return null
}

const pid = findPidOnPort(PORT)
if (!pid) {
  console.log(`[stop-if-running] 端口 ${PORT} 未被占用，跳过`)
  process.exit(0)
}

console.log(`[stop-if-running] 端口 ${PORT} 被 PID ${pid} 占用，停止该进程以便重建 dist`)
try {
  if (process.platform === 'win32') {
    execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
  } else {
    execSync(`kill -9 ${pid}`, { stdio: 'ignore' })
  }
  // 等待文件锁释放（Windows 下 taskkill 后 .node 锁可能稍延迟释放）
  execSync(
    process.platform === 'win32' ? 'ping -n 2 127.0.0.1 >nul 2>&1' : 'sleep 1',
    { stdio: 'ignore' },
  )
  console.log('[stop-if-running] 已停止占用端口的进程')
} catch {
  console.warn('[stop-if-running] 自动停止失败，请手动停止占用端口 3000 的进程后再构建')
}
process.exit(0)
