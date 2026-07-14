<template>
  <div class="home">
    <header class="hd">
      <div class="who" role="button" tabindex="0" @click="openSwitch" @keyup.enter="openSwitch">
        <div class="avatar">👶</div>
        <div>
          <div class="name">{{ currentBaby?.name || '未设置宝宝' }}</div>
        </div>
        <span class="who-arrow">›</span>
      </div>
      <n-button class="refresh-btn" :class="{ spinning: refreshing }" text size="small" :disabled="refreshing" @click="refresh" aria-label="刷新">
        <svg class="refresh-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
      </n-button>
    </header>

    <n-popover v-model:show="datePop" trigger="click" placement="bottom" :show-arrow="false">
      <template #trigger>
        <div class="date-bar">
          <button class="nav" @click.stop="prevDay" aria-label="前一天">‹</button>
          <div class="sel">
            <span class="d">{{ selectedDateLabel }}</span>
            <span class="w">{{ weekday }}</span>
          </div>
          <button class="nav" @click.stop="nextDay" :disabled="selectedDate === today" aria-label="后一天">›</button>
        </div>
      </template>
      <n-date-picker
        panel
        v-model:value="selectedTs"
        type="date"
        :is-date-disabled="disableFuture"
        :actions="null"
        @update:value="onPickDate"
      >
        <template #footer>
          <button class="today-btn" :disabled="selectedDate === today" @click="goToday">回到今日</button>
        </template>
      </n-date-picker>
    </n-popover>

    <section class="stats" v-if="currentBaby">
      <div class="stat">
        <div class="num">{{ stats.total_milk_ml }}<small>ml</small></div>
        <div class="lbl">{{ milkLabel }}</div>
      </div>
      <div class="stat">
        <div class="num">{{ stats.feed_count }}<small>次</small></div>
        <div class="lbl">喂养</div>
      </div>
      <div class="stat">
        <div class="num">{{ stats.avg_interval_min || '—' }}<small v-if="stats.avg_interval_min">分</small></div>
        <div class="lbl">平均间隔</div>
      </div>
      <div class="stat">
        <div class="num">{{ stats.sleep_min }}<small>分</small></div>
        <div class="lbl">睡眠</div>
      </div>
      <div class="stat">
        <div class="num">{{ stats.diaper_count }}<small>次</small></div>
        <div class="lbl">换尿布</div>
      </div>
    </section>

    <n-empty v-if="!currentBaby" description="还没创建宝宝" class="empty">
      <template #extra>
        <n-button type="primary" @click="goBaby">去「我的」创建</n-button>
      </template>
    </n-empty>

    <section class="timeline" v-else>
      <div class="sec-head">
        <div class="sec-title">📅 {{ viewingToday ? '近 7 天' : '近 7 天（截至 ' + selectedDateLabel + '）' }}</div>
        <button class="filter-btn" :class="{ active: isFilterActive }" type="button" @click="filterShow = true" aria-label="筛选记录类型">
          <svg class="filter-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          <span v-if="isFilterActive" class="filter-dot"></span>
        </button>
      </div>
      <div v-if="timeline.length === 0" class="no-data">{{ isFilterActive ? '当前筛选条件下没有记录' : '还没有记录，点右下角「＋」开始吧 👉' }}</div>
      <template v-for="grp in dayGroups" :key="grp.date">
        <div class="day-head">
          <span class="day-d">{{ grp.label }}</span>
          <span class="day-sum" v-if="grp.summary">{{ grp.summary }}</span>
        </div>
        <div v-for="(it, i) in grp.items" :key="grp.date + '-' + i" class="tl-item" @click="openEdit(it)">
          <div class="tl-icon">{{ it.icon }}</div>
          <div class="tl-body">
            <div class="tl-title">{{ it.title }}</div>
            <div class="tl-sub" v-if="it.sub">{{ it.sub }}</div>
            <div class="tl-gaps" v-if="it.gaps && it.gaps.length">
              <span class="tl-gap" :class="{ 'tl-gap-now': g.kind === 'now' }" v-for="(g, gi) in it.gaps" :key="gi">{{ g.text }}</span>
            </div>
          </div>
          <div class="tl-time">{{ it.time }}</div>
        </div>
      </template>
      <div class="build-info">构建于 {{ buildTime }} · v{{ appVersion }}</div>
    </section>

    <!-- 右下角悬浮记录按钮 -->
    <button class="fab" type="button" aria-label="记录" @click="goRecord">
      <span class="fab-plus">＋</span>
    </button>

    <!-- 切换宝宝弹框 -->
    <Transition name="sheet">
      <div class="sheet-mask" v-if="switchShow" @click="switchShow = false">
      <div class="sheet switch-sheet" @click.stop>
        <div class="sheet-hd">
          <span>切换宝宝</span>
          <button class="sheet-x" type="button" @click="switchShow = false" aria-label="关闭">×</button>
        </div>
        <div class="sheet-body switch-body">
          <div v-if="babies.length === 0" class="no-data">还没有宝宝，先添加一个吧</div>
          <button
            v-for="b in babies"
            :key="b.id"
            type="button"
            class="baby-row"
            :class="{ active: b.id === currentBaby?.id }"
            @click="pickBaby(b.id)"
          >
            <div class="avatar sm">👶</div>
            <div class="baby-meta">
              <div class="baby-name">{{ b.name }}</div>
              <div class="baby-gender">{{ genderLabel(b.gender) }}</div>
            </div>
            <span v-if="b.id === currentBaby?.id" class="cur-tag">当前</span>
            <button class="del-baby" type="button" aria-label="删除宝宝" @click.stop="removeBaby(b.id)">🗑</button>
          </button>

          <div v-if="adding" class="add-form">
            <div class="ef">
              <label>宝宝名字</label>
              <n-input v-model:value="addName" placeholder="如 小葡萄" />
            </div>
            <div class="ef">
              <label>生日</label>
              <n-date-picker
                v-model:value="addBirthdayTs"
                type="date"
                format="yyyy-MM-dd"
                clearable
                :is-date-disabled="disableFutureDate"
                input-readonly
              />
            </div>
            <div class="ef">
              <label>性别</label>
              <div class="seg">
                <button
                  v-for="o in genderOpts"
                  :key="o.value"
                  :class="['seg-btn', { active: addGender === o.value }]"
                  type="button"
                  @click="addGender = o.value"
                >
                  {{ o.label }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="switch-actions">
          <n-button v-if="!adding" block size="large" @click="adding = true">
            {{ babies.length ? '＋ 添加宝宝' : '＋ 创建第一个宝宝' }}
          </n-button>
          <template v-else>
            <n-button type="primary" block size="large" :loading="addLoading" @click="confirmAdd">保存</n-button>
            <n-button block @click="adding = false">取消</n-button>
          </template>
          <n-button block tertiary @click="goBaby">宝宝管理 / 我的</n-button>
        </div>
      </div>
    </div>
    </Transition>

    <!-- 编辑记录弹层 -->
    <Transition name="sheet">
      <div class="sheet-mask" v-if="editShow" @click="editShow = false">
      <div class="sheet" @click.stop>
        <div class="sheet-hd">
          <span>编辑记录</span>
          <button class="sheet-x" type="button" @click="editShow = false" aria-label="关闭">×</button>
        </div>
        <div class="sheet-body">
          <template v-if="editKind === 'feeding'">
            <template v-if="editType === 'breast'">
              <div class="ef">
                <label>左乳时长（分钟）</label>
                <n-input-number v-model:value="eLeft" :min="0" :max="240" placeholder="如 15" style="width: 100%" />
              </div>
              <div class="ef">
                <label>右乳时长（分钟）</label>
                <n-input-number v-model:value="eRight" :min="0" :max="240" placeholder="如 15" style="width: 100%" />
              </div>
            </template>
            <template v-else-if="editType === 'food'">
              <div class="ef">
                <label>辅食名称</label>
                <n-input v-model:value="eFood" placeholder="如 米粉、南瓜泥" />
              </div>
            </template>
            <template v-else>
              <div class="ef">
                <label>奶量（ml）</label>
                <n-input-number v-model:value="eAmount" :min="0" :max="500" placeholder="如 120" style="width: 100%" />
              </div>
            </template>
          </template>

          <template v-else-if="editKind === 'sleep'">
            <div class="ef">
              <label>入睡时间<span class="req">*</span></label>
              <n-date-picker v-model:value="eSleepStart" type="datetime" format="yyyy-MM-dd HH:mm" style="width: 100%" input-readonly />
            </div>
            <div class="ef">
              <label>醒来时间（选填）</label>
              <n-date-picker v-model:value="eSleepEnd" type="datetime" format="yyyy-MM-dd HH:mm" style="width: 100%" input-readonly />
            </div>
            <div class="ef" v-if="eSleepStart && eSleepEnd && editSleepMin > 0">
              <label>睡眠时长（自动计算）</label>
              <div class="sleep-dur-auto">{{ editSleepDurText }}</div>
            </div>
          </template>

          <template v-else>
            <div class="ef">
              <label>类型</label>
              <div class="seg">
                <button
                  v-for="o in diaperOpts"
                  :key="o.value"
                  :class="['seg-btn', { active: eDiaper === o.value }]"
                  type="button"
                  @click="eDiaper = o.value"
                >
                  {{ o.label }}
                </button>
              </div>
            </div>
          </template>

          <div class="ef" v-if="editKind !== 'sleep'">
            <label>时间</label>
            <n-date-picker v-model:value="eTs" type="datetime" format="yyyy-MM-dd HH:mm" style="width: 100%" input-readonly />
          </div>
          <div class="ef">
            <label>备注（可选）</label>
            <n-input
              v-model:value="eNote"
              type="textarea"
              placeholder="想记点什么…"
              :autosize="{ minRows: 2, maxRows: 4 }"
            />
          </div>
        </div>
        <div class="edit-actions">
          <n-button class="save-btn" type="primary" size="large" :loading="editLoading" @click="saveEdit">保存</n-button>
          <n-button
            class="del-icon-btn"
            size="large"
            secondary
            type="error"
            :disabled="editLoading"
            title="删除记录"
            @click="deleteCurrent"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </n-button>
        </div>
      </div>
    </div>
    </Transition>

    <!-- 记录类型筛选弹层 -->
    <Transition name="sheet">
      <div class="sheet-mask" v-if="filterShow" @click="filterShow = false">
        <div class="sheet filter-sheet" @click.stop>
          <div class="sheet-hd">
            <span>筛选记录类型</span>
            <button class="sheet-x" type="button" @click="filterShow = false" aria-label="关闭">×</button>
          </div>
          <div class="sheet-body filter-body">
            <button
              v-for="opt in FILTER_OPTIONS"
              :key="opt.value"
              type="button"
              class="filter-row"
              :class="{ on: typeFilter.includes(opt.value) }"
              @click="toggleType(opt.value)"
            >
              <span class="fi">{{ opt.icon }}</span>
              <span class="fl">{{ opt.label }}</span>
              <span class="fcheck">{{ typeFilter.includes(opt.value) ? '✓' : '' }}</span>
            </button>
          </div>
          <div class="filter-actions">
            <div class="filter-actions-row">
              <n-button @click="selectAll">全选</n-button>
              <n-button :disabled="typeFilter.length === 0" @click="clearAll">取消选中</n-button>
            </div>
            <n-button block type="primary" @click="filterShow = false">完成</n-button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { useBabyStore } from '@/stores/baby'
import { getStats, type DayStats } from '@/api/stats'
import { listFeedings, updateFeeding, deleteFeeding, type Feeding } from '@/api/feedings'
import { listSleeps, updateSleep, deleteSleep, type Sleep } from '@/api/sleeps'
import { listDiapers, updateDiaper, deleteDiaper, type Diaper } from '@/api/diapers'
import { formatClock, tsToIso, isoToTs } from '@/utils/time'
import { disableFutureDate, isBirthdayInFuture } from '@/utils/date'
import { useRevealRefresh } from '@/utils/reveal'

// 供 <keep-alive include="Home"> 精确匹配缓存
defineOptions({ name: 'Home' })

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const babyStore = useBabyStore()
const { currentBaby, babies } = storeToRefs(babyStore)

// 版本与打包时间（构建时由 Vite define 注入，见 vite.config.ts）
// 版本号统一取自仓库根 package.json 的 version（注入为 VITE_APP_VERSION）
const appVersion = (import.meta.env as any).VITE_APP_VERSION || '—'
const buildTime = __BUILD_TIME__

// 记录类型筛选：近 7 天列表按记录类型过滤
const ALL_TYPES = ['breast', 'formula', 'bottle', 'food', 'supplement', 'sleep', 'diaper']
const FILTER_OPTIONS = [
  { value: 'breast', label: '母乳', icon: '🤱' },
  { value: 'formula', label: '配方奶', icon: '🥛' },
  { value: 'bottle', label: '瓶喂母乳', icon: '🍼' },
  { value: 'food', label: '辅食', icon: '🍚' },
  { value: 'supplement', label: '营养补剂', icon: '💊' },
  { value: 'sleep', label: '睡眠', icon: '😴' },
  { value: 'diaper', label: '换尿布', icon: '💩' },
]
const FILTER_KEY = 'ml_type_filter'
function loadFilter(): string[] {
  try {
    const raw = localStorage.getItem(FILTER_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr) && arr.every((v) => ALL_TYPES.includes(v))) return arr
    }
  } catch {
    /* 忽略存储异常 */
  }
  return ALL_TYPES.slice()
}
const typeFilter = ref<string[]>(loadFilter())
const isFilterActive = computed(() => typeFilter.value.length < ALL_TYPES.length)
const filterShow = ref(false)
function saveFilter() {
  try {
    localStorage.setItem(FILTER_KEY, JSON.stringify(typeFilter.value))
  } catch {
    /* 忽略存储异常 */
  }
}
function toggleType(v: string) {
  if (typeFilter.value.includes(v)) {
    typeFilter.value = typeFilter.value.filter((x) => x !== v)
  } else {
    typeFilter.value = [...typeFilter.value, v]
  }
  saveFilter()
}
function selectAll() {
  typeFilter.value = ALL_TYPES.slice()
  saveFilter()
}
function clearAll() {
  typeFilter.value = []
  saveFilter()
}

const today = ref(todayStr())
// 日期切换：按选中日期查看历史数据
const selectedTs = ref(new Date(today.value + 'T00:00').getTime())
const datePop = ref(false)
const selectedDate = ref(today.value)
const viewingToday = computed(() => selectedDate.value === today.value)
const selectedDateLabel = computed(() => {
  const [, m, d] = selectedDate.value.split('-')
  return `${Number(m)}月${Number(d)}日`
})
const weekday = computed(() => {
  const [y, m, d] = selectedDate.value.split('-').map(Number)
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(y, m - 1, d).getDay()]
})
const milkLabel = computed(() => (viewingToday.value ? '今日奶量' : '当日奶量'))
function dateStr(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function shiftDateStr(d: string, delta: number): string {
  const [y, m, day] = d.split('-').map(Number)
  const dt = new Date(y, m - 1, day)
  dt.setDate(dt.getDate() + delta)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}
function shiftDay(delta: number) {
  const [y, m, d] = selectedDate.value.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + delta)
  selectedTs.value = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime()
}
function prevDay() {
  shiftDay(-1)
}
function nextDay() {
  if (selectedDate.value < today.value) shiftDay(1)
}
function disableFuture(ts: number) {
  const t = new Date(ts)
  t.setHours(0, 0, 0, 0)
  const t0 = new Date()
  t0.setHours(0, 0, 0, 0)
  return t.getTime() > t0.getTime()
}
// 程序化修改 selectedTs（跨天跟随）时跳过二次刷新，避免 watch 触发重复请求
let internalDateChange = false
watch(selectedTs, (ts) => {
  selectedDate.value = dateStr(ts)
  if (internalDateChange) {
    internalDateChange = false
    return
  }
  refresh()
})
watch(
  () => currentBaby.value?.id,
  (id, prev) => {
    if (id != null && id !== prev) refresh()
  },
)
function onPickDate() {
  datePop.value = false
}
function goToday() {
  if (selectedDate.value !== today.value) {
    selectedTs.value = new Date(today.value + 'T00:00').getTime()
  }
  datePop.value = false
}
const stats = ref<DayStats>({
  total_milk_ml: 0,
  feed_count: 0,
  avg_interval_min: 0,
  sleep_min: 0,
  diaper_count: 0,
})
const feedings = ref<Feeding[]>([])
const sleeps = ref<Sleep[]>([])
const diapers = ref<Diaper[]>([])
// 原始拉取数据（未过滤），供按类型筛选时复用，无需重新请求
const allFeedings = ref<Feeding[]>([])
const allSleeps = ref<Sleep[]>([])
const allDiapers = ref<Diaper[]>([])
const prevFeedings = ref<Feeding[]>([])
const prevSleeps = ref<Sleep[]>([])
const prevDiapers = ref<Diaper[]>([])
const timeline = ref<{ time: string; sortKey: string; icon: string; title: string; sub?: string; gaps: { text: string; kind: 'now' | 'last' }[]; kind: 'feeding' | 'sleep' | 'diaper'; type: string; id: number; raw: any; anchorTs: number; gapStartTs: number }[]>([])

// 按当前类型筛选重建展示数据（feedings/sleeps/diapers 与「距上次」下界均受筛选影响），
// 切换筛选时调用，无需重新请求后端。
function rebuild() {
  const set = new Set(typeFilter.value)
  feedings.value = set.size === ALL_TYPES.length ? allFeedings.value : allFeedings.value.filter((r) => set.has(r.type))
  sleeps.value = set.has('sleep') ? allSleeps.value : []
  diapers.value = set.has('diaper') ? allDiapers.value : []
  const prevDayLastByType: Record<string, number> = {}
  const bump = (key: string, ms: number) => {
    if (prevDayLastByType[key] == null || ms > prevDayLastByType[key]) prevDayLastByType[key] = ms
  }
  if (set.has('sleep')) prevSleeps.value.forEach((r) => bump('sleep', sleepAnchor(r)))
  if (set.has('diaper')) prevDiapers.value.forEach((r) => bump('diaper', new Date(r.occurred_at.replace(' ', 'T')).getTime()))
  prevFeedings.value.forEach((r) => {
    if (set.has(r.type)) bump(r.type, new Date(r.occurred_at.replace(' ', 'T')).getTime())
  })
  buildTimeline(prevDayLastByType)
}
watch(typeFilter, rebuild)

const refreshing = ref(false)

async function refresh() {
  refreshing.value = true
  try {
    // 跨天修正：以真实「今天」为准。首页被 keep-alive 缓存时，组件挂载时计算的
    // 今天会过期；此处每次刷新重新取真实日期，若用户正停留在「今天」视图则自动
    // 跟随到新的一天，确保新日期的记录被纳入查询窗口（否则会卡在旧日期刷不出来）。
    const newToday = todayStr()
    if (selectedDate.value === today.value && newToday !== today.value) {
      internalDateChange = true
      selectedDate.value = newToday
      selectedTs.value = new Date(newToday + 'T00:00').getTime()
    }
    today.value = newToday
    await babyStore.fetch()
    // 以选中日期为窗口最末一天，向前取 6 天，共近 7 天
    const fromDate = shiftDateStr(selectedDate.value, -6)
    const prevDate = shiftDateStr(fromDate, -1) // 前一天（用于最早项跨天「距上次」）
    const bid = currentBaby.value?.id
    const [s, f, sl, d, pf, ps, pd] = await Promise.all([
      getStats(selectedDate.value, bid),
      listFeedings({ from: fromDate, to: selectedDate.value, babyId: bid }),
      listSleeps({ from: fromDate, to: selectedDate.value, babyId: bid }),
      listDiapers({ from: fromDate, to: selectedDate.value, babyId: bid }),
      listFeedings({ date: prevDate, babyId: bid }),
      listSleeps({ date: prevDate, babyId: bid }),
      listDiapers({ date: prevDate, babyId: bid }),
    ])
    stats.value = s
    allFeedings.value = f
    allSleeps.value = sl
    allDiapers.value = d
    prevFeedings.value = pf
    prevSleeps.value = ps
    prevDiapers.value = pd
    rebuild()
  } catch (e: any) {
    message.error(e?.message || '加载失败')
  } finally {
    refreshing.value = false
  }
}

// 睡眠「事件锚点」：优先用醒来时间；无醒来时间则用「入睡时间 + 时长」（进行中回退入睡时间）
function sleepAnchor(r: { sleep_start?: string | null; sleep_end?: string | null; duration_min?: number; occurred_at: string }): number {
  const toMs = (s?: string | null) => (s ? new Date(s.replace(' ', 'T')).getTime() : NaN)
  const end = toMs(r.sleep_end)
  if (!isNaN(end)) return end
  const start = toMs(r.sleep_start)
  const dur = (r.duration_min || 0) * 60000
  if (!isNaN(start) && dur > 0) return start + dur
  return toMs(r.occurred_at) || Date.now()
}

function buildTimeline(prevDayLastByType: Record<string, number>) {
  const items: { time: string; sortKey: string; icon: string; title: string; sub?: string; kind: 'feeding' | 'sleep' | 'diaper'; type: string; id: number; raw: any; anchorTs: number; gapStartTs: number; gaps: { text: string; kind: 'now' | 'last' }[] }[] = []
  feedings.value.forEach((f) => {
    let icon = '🍼'
    let title = ''
    if (f.type === 'breast') {
      icon = '🤱'
      const parts: string[] = []
      if (f.left_duration_min) parts.push(`左${f.left_duration_min}分钟`)
      if (f.right_duration_min) parts.push(`右${f.right_duration_min}分钟`)
      title = '母乳' + (parts.length ? ' ' + parts.join(' / ') : '')
    } else if (f.type === 'formula') {
      icon = '🥛'
      title = `配方奶 ${f.amount_ml ?? 0}ml`
    } else if (f.type === 'bottle') {
      icon = '🍼'
      title = `瓶喂母乳 ${f.amount_ml ?? 0}ml`
    } else if (f.type === 'supplement') {
      icon = '💊'
      title = `营养补剂 ${f.supplement_name || ''}`.trim()
    } else {
      icon = '🍚'
      title = `辅食 ${f.food_name || ''}`.trim()
    }
    items.push({ time: formatClock(f.occurred_at), sortKey: f.occurred_at, icon, title, sub: f.note || undefined, kind: 'feeding', type: f.type, id: f.id, raw: f, anchorTs: new Date(f.occurred_at.replace(' ', 'T')).getTime(), gapStartTs: new Date(f.occurred_at.replace(' ', 'T')).getTime() })
  })
  sleeps.value.forEach((s) => {
    const timeStr = s.sleep_start && s.sleep_end
      ? `${formatClock(s.sleep_start)} → ${formatClock(s.sleep_end)}`
      : formatClock(s.occurred_at)
    const title = s.duration_min > 0 ? `睡眠 ${fmtDuration(s.duration_min)}` : '睡眠 · 进行中'
    items.push({ time: timeStr, sortKey: s.occurred_at, icon: '😴', title, sub: s.note || undefined, kind: 'sleep', type: 'sleep', id: s.id, raw: s, anchorTs: sleepAnchor(s), gapStartTs: s.sleep_start ? new Date(s.sleep_start.replace(' ', 'T')).getTime() : sleepAnchor(s) })
  })
  diapers.value.forEach((d) => {
    const map: Record<string, string> = { pee: '尿片', poo: '便便', both: '尿+便' }
    items.push({ time: formatClock(d.occurred_at), sortKey: d.occurred_at, icon: '💩', title: map[d.type] || '换尿布', sub: d.note || undefined, kind: 'diaper', type: 'diaper', id: d.id, raw: d, anchorTs: new Date(d.occurred_at.replace(' ', 'T')).getTime(), gapStartTs: new Date(d.occurred_at.replace(' ', 'T')).getTime() })
  })
  items.sort((a, b) => b.sortKey.localeCompare(a.sortKey))
  const now = Date.now()
  // 「距上次」改为「对应类型」的距上次：仅与同类型、时间上更早的记录比较
  const typeLabel: Record<string, string> = {
    breast: '母乳',
    formula: '配方奶',
    bottle: '瓶喂母乳',
    food: '辅食',
    supplement: '营养补剂',
    sleep: '睡眠',
    diaper: '换尿布',
  }
  const byType: Record<string, typeof items> = {}
  for (const it of items) (byType[it.type] ||= []).push(it)
  for (const list of Object.values(byType)) {
    const label = typeLabel[list[0].type] || '记录'
    // 睡眠的「距上次」表达为「距上次醒来」更贴合语义（本次入睡 − 上次醒来）
    const lastLabel = list[0].type === 'sleep' ? '醒来' : label
    list.forEach((it, k) => {
      const gaps: { text: string; kind: 'now' | 'last' }[] = []
      // 距现在：以各类型「事件锚点」为准（睡眠优先用醒来时间，其余用记录时间）
      if (k === 0) {
        gaps.push({ text: '距现在 ' + fmtGap(Math.max(0, Math.round((now - it.anchorTs) / 60000))), kind: 'now' })
      }
      // 距上次：以「距上次起点」为准——睡眠取开始入睡时间(sleep_start)，其余取记录时间；
      //          相对同类型时间上更早的一条（窗口内 list[k+1] 的锚点，否则前一天 prevDayLastByType，
      //          睡眠类该锚点即为其「醒来时间」，故结果为「本次入睡 − 上次醒来」）
      let olderTs: number | null = null
      if (k < list.length - 1) {
        olderTs = list[k + 1].anchorTs
      } else {
        const prev = prevDayLastByType[it.type]
        if (prev != null) olderTs = prev
      }
      if (olderTs != null) {
        gaps.push({ text: '距上次' + lastLabel + ' ' + fmtGap(Math.max(1, Math.round((it.gapStartTs - olderTs) / 60000))), kind: 'last' })
      }
      it.gaps = gaps
    })
  }
  timeline.value = items
}

// 按「日」分组（最新一天在前），每组含日期标签与当日小结
const dayGroups = computed(() => {
  const groups: { date: string; label: string; summary: string; items: typeof timeline.value }[] = []
  for (const it of timeline.value) {
    const day = it.sortKey.slice(0, 10)
    let g = groups.find((x) => x.date === day)
    if (!g) {
      g = { date: day, label: dayLabel(day), summary: '', items: [] }
      groups.push(g)
    }
    g.items.push(it)
  }
  for (const g of groups) g.summary = daySummary(g.date)
  return groups
})

function dayLabel(day: string): string {
  if (day === today.value) return '今日记录'
  if (day === shiftDateStr(today.value, -1)) return '昨天'
  if (day === shiftDateStr(today.value, -2)) return '前天'
  const [y, m, d] = day.split('-').map(Number)
  const w = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(y, m - 1, d).getDay()]
  return `${Number(m)}月${Number(d)}日 ${w}`
}

function daySummary(day: string): string {
  const f = feedings.value.filter((x) => x.occurred_at.slice(0, 10) === day)
  const sl = sleeps.value.filter((x) => x.occurred_at.slice(0, 10) === day)
  const d = diapers.value.filter((x) => x.occurred_at.slice(0, 10) === day)
  const parts: string[] = []
  if (f.length) {
    parts.push(`哺乳${f.length}次`)
    const milk = f.filter((x) => x.type === 'formula' || x.type === 'bottle').reduce((s, x) => s + (x.amount_ml || 0), 0)
    if (milk) parts.push(`奶量${milk}ml`)
  }
  if (sl.length) parts.push(`睡眠${sl.length}次`)
  if (d.length) parts.push(`尿布${d.length}次`)
  return parts.join(' · ')
}

function fmtGap(min: number): string {
  if (min < 1) return '刚刚'
  const d = Math.floor(min / 1440)
  const h = Math.floor((min % 1440) / 60)
  const m = min % 60
  if (d > 0) return h > 0 ? `${d}天${h}小时` : `${d}天`
  if (h > 0) return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
  return `${m}分钟`
}

// 睡眠时长格式化：<60 分钟显示「N分钟」；整小时显示「N小时」；超过整小时显示「N小时M分钟」
function fmtDuration(min: number): string {
  if (min < 60) return `${min}分钟`
  const h = Math.floor(min / 60)
  const r = min % 60
  return r > 0 ? `${h}小时${r}分钟` : `${h}小时`
}

const switchShow = ref(false)
const adding = ref(false)
const addName = ref('')
const addBirthdayTs = ref<number | null>(null)
const addGender = ref<'male' | 'female' | 'unknown'>('unknown')
const addLoading = ref(false)
const genderOpts = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'unknown', label: '未知' },
]
function genderLabel(g: string): string {
  return ({ male: '男', female: '女', unknown: '未知' } as Record<string, string>)[g] || '未知'
}
function fmtDate(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function openSwitch() {
  switchShow.value = true
}
function pickBaby(id: number) {
  babyStore.selectBaby(id)
  switchShow.value = false
}
function goBaby() {
  router.push('/baby')
}
function goRecord() {
  router.push('/record')
}
async function confirmAdd() {
  if (!addName.value.trim()) {
    message.warning('请填写宝宝名字')
    return
  }
  if (isBirthdayInFuture(addBirthdayTs.value)) {
    message.warning('生日不能晚于今天')
    return
  }
  addLoading.value = true
  try {
    await babyStore.add({
      name: addName.value.trim(),
      birthday: addBirthdayTs.value ? fmtDate(addBirthdayTs.value) : null,
      gender: addGender.value,
    })
    message.success('已添加')
    adding.value = false
    addName.value = ''
    addBirthdayTs.value = null
    addGender.value = 'unknown'
    switchShow.value = false
  } catch (e: any) {
    message.error(e?.message || '添加失败')
  } finally {
    addLoading.value = false
  }
}
function removeBaby(id: number) {
  const b = babies.value.find((x) => x.id === id)
  dialog.warning({
    title: '删除宝宝',
    content: `确定删除「${b?.name || '该宝宝'}」吗？该宝宝的所有记录也会一并删除，且无法恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    type: 'error',
    onPositiveClick: async () => {
      try {
        await babyStore.remove(id)
        message.success('已删除')
        if (babies.value.length === 0) switchShow.value = false
      } catch (e: any) {
        message.error(e?.message || '删除失败')
      }
    },
  })
}

// ---------- 首页记录列表：点击编辑 ----------
const diaperOpts = [
  { value: 'pee', label: '尿' },
  { value: 'poo', label: '便' },
  { value: 'both', label: '尿+便' },
]
const editShow = ref(false)
const editKind = ref<'feeding' | 'sleep' | 'diaper'>('feeding')
const editId = ref(0)
const editType = ref<string>('')
const eLeft = ref<number | null>(null)
const eRight = ref<number | null>(null)
const eAmount = ref<number | null>(null)
const eFood = ref('')
const eDuration = ref<number | null>(null)
const eSleepStart = ref<number | null>(null)
const eSleepEnd = ref<number | null>(null)
const eDiaper = ref<'pee' | 'poo' | 'both'>('pee')
const eNote = ref('')
const eTs = ref(Date.now())
const editLoading = ref(false)
const editSleepMin = computed(() => {
  if (!eSleepStart.value || !eSleepEnd.value) return 0
  const diffMs = eSleepEnd.value - eSleepStart.value
  if (diffMs <= 0) return 0
  return Math.ceil(diffMs / 60000)
})
const editSleepDurText = computed(() => {
  const m = editSleepMin.value
  if (!m) return ''
  const h = Math.floor(m / 60)
  const r = m % 60
  if (h > 0 && r > 0) return `共 ${h} 小时 ${r} 分钟`
  if (h > 0) return `共 ${h} 小时`
  return `共 ${m} 分钟`
})

function openEdit(it: any) {
  editKind.value = it.kind
  editId.value = it.id
  const r = it.raw
  eLeft.value = null
  eRight.value = null
  eAmount.value = null
  eFood.value = ''
  eDuration.value = null
  eDiaper.value = 'pee'
  if (it.kind === 'feeding') {
    editType.value = r.type
    if (r.type === 'breast') {
      eLeft.value = r.left_duration_min
      eRight.value = r.right_duration_min
    } else if (r.type === 'food') {
      eFood.value = r.food_name || ''
    } else {
      eAmount.value = r.amount_ml
    }
  } else if (it.kind === 'sleep') {
    eSleepStart.value = r.sleep_start ? isoToTs(r.sleep_start) : null
    eSleepEnd.value = r.sleep_end ? isoToTs(r.sleep_end) : null
  } else {
    eDiaper.value = r.type
  }
  eNote.value = r.note || ''
  eTs.value = isoToTs(r.occurred_at)
  editShow.value = true
}

async function saveEdit() {
  editLoading.value = true
  try {
    if (editKind.value === 'feeding') {
      if (editType.value === 'breast') {
        if (!eLeft.value && !eRight.value) {
          message.warning('请至少填写一侧母乳时长')
          editLoading.value = false
          return
        }
      } else if (editType.value !== 'food' && (!eAmount.value || eAmount.value <= 0)) {
        message.warning('请填写有效的奶量')
        editLoading.value = false
        return
      }
      await updateFeeding(editId.value, {
        left_duration_min: eLeft.value,
        right_duration_min: eRight.value,
        amount_ml: eAmount.value,
        food_name: eFood.value || null,
        note: eNote.value || null,
        occurred_at: tsToIso(eTs.value),
      })
    } else if (editKind.value === 'sleep') {
      if (!eSleepStart.value) {
        message.warning('请填写入睡时间')
        editLoading.value = false
        return
      }
      const payload: any = { sleep_start: tsToIso(eSleepStart.value), note: eNote.value || null, occurred_at: tsToIso(eSleepStart.value) }
      if (eSleepEnd.value && editSleepMin.value > 0) {
        payload.sleep_end = tsToIso(eSleepEnd.value)
      }
      await updateSleep(editId.value, payload)
    } else {
      await updateDiaper(editId.value, {
        type: eDiaper.value,
        note: eNote.value || null,
        occurred_at: tsToIso(eTs.value),
      })
    }
    message.success('已更新')
    editShow.value = false
    await refresh()
  } catch (e: any) {
    message.error(e?.message || '保存失败')
  } finally {
    editLoading.value = false
  }
}

function deleteCurrent() {
  dialog.warning({
    title: '删除记录',
    content: '确定删除这条记录吗？删除后无法恢复。',
    positiveText: '删除',
    negativeText: '取消',
    type: 'error',
    onPositiveClick: async () => {
      editLoading.value = true
      try {
        if (editKind.value === 'feeding') await deleteFeeding(editId.value)
        else if (editKind.value === 'sleep') await deleteSleep(editId.value)
        else await deleteDiaper(editId.value)
        message.success('已删除')
        editShow.value = false
        await refresh()
      } catch (e: any) {
        message.error(e?.message || '删除失败')
      } finally {
        editLoading.value = false
      }
    },
  })
}

function todayStr(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

onMounted(refresh)
// 从其他页面返回（keep-alive 重新激活）时刷新数据：
// 缓存的 DOM 仍在，列表不会闪空；同时拉取最新数据更新视图。
// 首次挂载时 onActivated 也会触发一次，用 activatedOnce 跳过（onMounted 已加载）。
let activatedOnce = false
onActivated(() => {
  if (!activatedOnce) {
    activatedOnce = true
    return
  }
  refresh()
})
// 从后台切回前台时刷新当前页面
useRevealRefresh(refresh)
</script>

<style scoped>
.home {
  padding: 16px 16px 24px;
}
.hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.who {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  border-radius: 12px;
  padding: 4px 8px 4px 4px;
  margin: -4px 0;
  transition: background 0.15s;
  outline: none;
}
.who:active {
  background: var(--card-pink);
}
.who-arrow {
  font-size: 20px;
  line-height: 1;
  color: var(--text-4);
  margin-left: 2px;
}
.refresh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 50%;
  color: var(--text-2);
  transition: background 0.15s, color 0.15s;
}
.refresh-btn .refresh-icon {
  flex: none;
}
.refresh-btn:hover {
  background: var(--card-pink);
  color: var(--primary);
}
.refresh-btn:disabled,
.refresh-btn.spinning {
  cursor: default;
}
.refresh-btn.spinning:hover {
  background: transparent;
  color: var(--text-2);
}
.refresh-btn.spinning .refresh-icon {
  animation: refresh-spin 0.8s linear infinite;
}
@keyframes refresh-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--avatar-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
.name {
  font-size: 17px;
  font-weight: 600;
  color: var(--text);
}
.date-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-bottom: 16px;
}
.date-bar .nav {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid var(--tag-border);
  background: var(--card);
  color: var(--primary-deep);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}
.date-bar .nav:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.date-bar .sel {
  display: flex;
  align-items: baseline;
  gap: 6px;
  cursor: pointer;
}
.date-bar .d {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-1);
}
.date-bar .w {
  font-size: 12px;
  color: var(--text-3);
}
.today-btn {
  width: 100%;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}
.today-btn:hover:not(:disabled) {
  background: var(--border-soft);
}
.today-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}
.stat {
  background: var(--card);
  border-radius: 14px;
  padding: 12px 4px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}
.num {
  font-size: 17px;
  font-weight: 700;
  color: var(--primary-deep);
}
.num small {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-3);
  margin-left: 1px;
}
.lbl {
  font-size: 11px;
  color: var(--text-3);
  margin-top: 4px;
}
.empty {
  margin-top: 60px;
}
.sec-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--text-1);
}
.sec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.sec-head .sec-title {
  margin-bottom: 0;
}
.filter-btn {
  position: relative;
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--tag-border);
  background: var(--card);
  color: var(--text-2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.filter-btn:active {
  background: var(--card-pink);
}
.filter-btn.active {
  color: var(--primary);
  border-color: var(--primary);
  background: var(--card-pink);
}
.filter-btn .filter-icon {
  flex: none;
}
.filter-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
  border: 1.5px solid var(--card);
}
.day-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin: 14px 2px 8px;
  padding-top: 4px;
}
.day-head:first-of-type {
  margin-top: 0;
}
.day-head .day-d {
  font-size: 13px;
  font-weight: 700;
  color: var(--primary-deep);
}
.day-head .day-sum {
  font-size: 11px;
  color: var(--text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.no-data {
  color: var(--text-3);
  font-size: 13px;
  text-align: center;
  padding: 40px 0;
}
.build-info {
  text-align: center;
  font-size: 11px;
  color: var(--text-4);
  padding: 18px 0 20px;
  letter-spacing: 0.3px;
}
.tl-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--card);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  cursor: pointer;
  transition: background 0.15s;
}
.tl-item:active {
  background: var(--card-pink);
}
.tl-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--card-pink);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex: none;
}
.tl-body {
  flex: 1;
  min-width: 0;
}
.tl-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}
.tl-sub {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tl-gaps {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}
.tl-gap {
  display: inline-block;
  font-size: 11px;
  color: var(--primary);
  background: var(--card-pink);
  border-radius: 8px;
  padding: 1px 7px;
}
/* 「距现在」标签：绿色，与粉色「距上次」标签区分 */
.tl-gap-now {
  color: var(--now-text);
  background: var(--now-bg);
}
.tl-time {
  font-size: 12px;
  color: var(--text-4);
  flex: none;
}
.fab {
  position: fixed;
  right: calc(50% - 240px + 20px);
  bottom: calc(24px + env(safe-area-inset-bottom));
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #ff95b8, #f25c8a);
  color: #fff;
  box-shadow: 0 6px 18px rgba(242, 92, 138, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 40;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.fab:active {
  transform: scale(0.92);
  box-shadow: 0 3px 10px rgba(242, 92, 138, 0.4);
}
.fab-plus {
  font-size: 30px;
  line-height: 1;
  font-weight: 300;
  margin-top: -2px;
}
@media (max-width: 480px) {
  .fab {
    right: 20px;
  }
}
.sheet-mask {
  position: fixed;
  inset: 0;
  background: var(--mask);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 50;
}
.sheet {
  width: 100%;
  max-width: 480px;
  background: var(--sheet-bg);
  border-radius: 16px 16px 0 0;
  padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
}
/* 弹框进出动画：由 Vue <Transition name="sheet"> 驱动（遮罩淡入淡出 + 面板从底部滑入滑出） */
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s ease;
}
.sheet-enter-active .sheet,
.sheet-leave-active .sheet {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from .sheet,
.sheet-leave-to .sheet {
  transform: translateY(100%);
}
.sheet-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.sheet-hd > span {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-1);
}
.sheet-x {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: var(--border-soft);
  color: var(--text-2);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}
.sheet-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 16px;
  max-height: 60vh;
  overflow-y: auto;
}
.ef {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ef label {
  font-size: 13px;
  color: var(--text-2);
}
.edit-actions {
  display: flex;
  align-items: stretch;
  gap: 10px;
  margin-top: 14px;
}
.edit-actions .save-btn {
  flex: 1 1 auto;
  min-width: 0;
}
.edit-actions .del-icon-btn {
  flex: 0 0 52px;
  width: 52px;
  padding: 0;
  border-radius: 14px;
}
.seg {
  display: flex;
  gap: 8px;
}
.seg-btn {
  flex: 1;
  border: 1px solid var(--border);
  background: var(--card);
  border-radius: 10px;
  padding: 10px;
  font-size: 13px;
  color: var(--text-1);
  cursor: pointer;
}
.seg-btn.active {
  background: var(--card-pink);
  border-color: var(--primary);
  color: var(--primary-deep);
  font-weight: 600;
}
.switch-sheet {
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}
.switch-body {
  margin-bottom: 8px;
}
.baby-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  text-align: left;
}
.baby-row.active {
  border-color: var(--primary);
  background: var(--card-pink);
}
.avatar.sm {
  width: 38px;
  height: 38px;
  font-size: 20px;
  border-radius: 50%;
  background: var(--avatar-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.baby-meta {
  flex: 1;
  min-width: 0;
}
.baby-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}
.baby-gender {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 2px;
}
.cur-tag {
  font-size: 11px;
  color: var(--primary-deep);
  background: #fff;
  border-radius: 8px;
  padding: 1px 8px;
}
.del-baby {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: none;
  background: rgba(255, 77, 79, 0.12);
  font-size: 16px;
  cursor: pointer;
  flex: none;
  transition: background 0.15s ease;
}
.del-baby:hover {
  background: rgba(255, 77, 79, 0.24);
}
.del-baby:active {
  background: rgba(255, 77, 79, 0.34);
}
.add-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--card);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 8px;
}
.switch-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-soft);
}
.filter-sheet {
  max-height: 88vh;
  display: flex;
  flex-direction: column;
}
.filter-body {
  margin-bottom: 0;
  flex: 1 1 auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, border-color 0.15s;
}
.filter-row:active {
  background: var(--card-pink);
}
.filter-row.on {
  border-color: var(--primary);
  background: var(--card-pink);
}
.filter-row .fi {
  font-size: 20px;
  flex: none;
}
.filter-row .fl {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}
.filter-row .fcheck {
  flex: none;
  width: 20px;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  color: var(--primary);
}
.filter-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-soft);
  flex: none;
}
.filter-actions-row {
  display: flex;
  gap: 10px;
}
.filter-actions-row :deep(.n-button) {
  flex: 1 1 0;
  min-width: 0;
}
.sleep-dur-auto {
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-deep);
  padding: 8px 0 2px;
}
</style>
