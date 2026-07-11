<template>
  <div class="home">
    <header class="hd">
      <div class="who">
        <div class="avatar">👶</div>
        <div>
          <div class="name">{{ baby?.name || '未设置宝宝' }}</div>
        </div>
      </div>
      <n-button text size="small" @click="refresh">刷新</n-button>
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
        v-model:value="selectedTs"
        type="date"
        :is-date-disabled="disableFuture"
        format="M月d日"
        size="small"
        @update:value="onPickDate"
      />
    </n-popover>

    <section class="stats" v-if="baby">
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

    <n-empty v-if="!baby" description="还没创建宝宝" class="empty">
      <template #extra>
        <n-button type="primary" @click="goBaby">去「我的」创建</n-button>
      </template>
    </n-empty>

    <section class="timeline" v-else>
      <div class="sec-title">📅 {{ viewingToday ? '近 7 天' : '近 7 天（截至 ' + selectedDateLabel + '）' }}</div>
      <div v-if="timeline.length === 0" class="no-data">还没有记录，点底部「记录」开始吧 👇</div>
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
            <div class="tl-gap" v-if="it.gap">{{ it.gap }}</div>
          </div>
          <div class="tl-time">{{ it.time }}</div>
        </div>
      </template>
    </section>

    <!-- 编辑记录弹层 -->
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
              <label>睡眠时长（分钟）</label>
              <n-input-number v-model:value="eDuration" :min="1" :max="600" placeholder="如 90" style="width: 100%" />
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

          <div class="ef">
            <label>时间</label>
            <n-date-picker v-model:value="eTs" type="datetime" format="yyyy-MM-dd HH:mm" style="width: 100%" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { useBabyStore } from '@/stores/baby'
import { getStats, type DayStats } from '@/api/stats'
import { listFeedings, updateFeeding, deleteFeeding, type Feeding } from '@/api/feedings'
import { listSleeps, updateSleep, deleteSleep, type Sleep } from '@/api/sleeps'
import { listDiapers, updateDiaper, deleteDiaper, type Diaper } from '@/api/diapers'
import { formatTime, tsToIso, isoToTs } from '@/utils/time'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const babyStore = useBabyStore()
const { baby } = storeToRefs(babyStore)

const today = todayStr()
// 日期切换：按选中日期查看历史数据
const selectedTs = ref(new Date(today + 'T00:00').getTime())
const datePop = ref(false)
const selectedDate = ref(today)
const viewingToday = computed(() => selectedDate.value === today)
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
  if (selectedDate.value < today) shiftDay(1)
}
function disableFuture(ts: number) {
  const t = new Date(ts)
  t.setHours(0, 0, 0, 0)
  const t0 = new Date()
  t0.setHours(0, 0, 0, 0)
  return t.getTime() > t0.getTime()
}
watch(selectedTs, (ts) => {
  selectedDate.value = dateStr(ts)
  refresh()
})
function onPickDate() {
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
const timeline = ref<{ time: string; sortKey: string; icon: string; title: string; sub?: string; gap?: string; kind: 'feeding' | 'sleep' | 'diaper'; id: number; raw: any }[]>([])

async function refresh() {
  try {
    await babyStore.fetch()
    // 以选中日期为窗口最末一天，向前取 6 天，共近 7 天
    const fromDate = shiftDateStr(selectedDate.value, -6)
    const prevDate = shiftDateStr(fromDate, -1) // 前一天（用于最早项跨天「距上次」）
    const [s, f, sl, d, pf, ps, pd] = await Promise.all([
      getStats(selectedDate.value),
      listFeedings({ from: fromDate, to: selectedDate.value }),
      listSleeps({ from: fromDate, to: selectedDate.value }),
      listDiapers({ from: fromDate, to: selectedDate.value }),
      listFeedings({ date: prevDate }),
      listSleeps({ date: prevDate }),
      listDiapers({ date: prevDate }),
    ])
    stats.value = s
    feedings.value = f
    sleeps.value = sl
    diapers.value = d
    // 前一天最后一条记录（7 天窗口之外，作为最早项的「距上次」下界）
    const prevAll = [...pf, ...ps, ...pd]
    const prevDayLast = prevAll.length
      ? prevAll.reduce((m, r) => (r.occurred_at > m ? r.occurred_at : m), prevAll[0].occurred_at)
      : null
    buildTimeline(prevDayLast)
  } catch (e: any) {
    message.error(e?.message || '加载失败')
  }
}

function buildTimeline(prevDayLast: string | null) {
  const items: { time: string; sortKey: string; icon: string; title: string; sub?: string }[] = []
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
      title = `瓶喂 ${f.amount_ml ?? 0}ml`
    } else {
      icon = '🍚'
      title = `辅食 ${f.food_name || ''}`.trim()
    }
    items.push({ time: formatTime(f.occurred_at), sortKey: f.occurred_at, icon, title, sub: f.note || undefined, kind: 'feeding', id: f.id, raw: f })
  })
  sleeps.value.forEach((s) => {
    items.push({ time: formatTime(s.occurred_at), sortKey: s.occurred_at, icon: '😴', title: `睡眠 ${s.duration_min}分钟`, sub: s.note || undefined, kind: 'sleep', id: s.id, raw: s })
  })
  diapers.value.forEach((d) => {
    const map: Record<string, string> = { pee: '尿片', poo: '便便', both: '尿+便' }
    items.push({ time: formatTime(d.occurred_at), sortKey: d.occurred_at, icon: '💩', title: map[d.type] || '换尿布', sub: d.note || undefined, kind: 'diaper', id: d.id, raw: d })
  })
  items.sort((a, b) => b.sortKey.localeCompare(a.sortKey))
  const now = Date.now()
  // 「距上次」= 距时间上更早的记录（倒序数组中的下一项）；最新一条若是今天则显示「距现在」
  timeline.value = items.map((it, i) => {
    const cur = new Date(it.sortKey.replace(' ', 'T')).getTime()
    let gap = ''
    if (i === 0) {
      if (it.sortKey.slice(0, 10) === today) gap = '距现在 ' + fmtGap(Math.max(0, Math.round((now - cur) / 60000)))
    } else if (i < items.length - 1) {
      const older = new Date(items[i + 1].sortKey.replace(' ', 'T')).getTime()
      gap = '距上次 ' + fmtGap(Math.max(1, Math.round((cur - older) / 60000)))
    } else if (prevDayLast) {
      // 最早一项：用 7 天窗口前一天的最后记录作为「距上次」下界（跨天回溯）
      const older = new Date(prevDayLast.replace(' ', 'T')).getTime()
      gap = '距上次 ' + fmtGap(Math.max(1, Math.round((cur - older) / 60000)))
    }
    return { ...it, gap }
  })
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
  if (day === today) return '今日记录'
  if (day === shiftDateStr(today, -1)) return '昨天'
  if (day === shiftDateStr(today, -2)) return '前天'
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
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h > 0) return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
  return `${m}分钟`
}

function goBaby() {
  router.push('/baby')
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
const eDiaper = ref<'pee' | 'poo' | 'both'>('pee')
const eNote = ref('')
const eTs = ref(Date.now())
const editLoading = ref(false)

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
    eDuration.value = r.duration_min
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
      if (!eDuration.value || eDuration.value <= 0) {
        message.warning('请填写有效的睡眠时长')
        editLoading.value = false
        return
      }
      await updateSleep(editId.value, {
        duration_min: eDuration.value,
        note: eNote.value || null,
        occurred_at: tsToIso(eTs.value),
      })
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
}
.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #ffe3ec;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
.name {
  font-size: 17px;
  font-weight: 600;
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
  border: 1px solid #ffe3ec;
  background: #fff;
  color: #ff5c8a;
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
  color: #4a4f5c;
}
.date-bar .w {
  font-size: 12px;
  color: #9aa0ad;
}
.stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}
.stat {
  background: #fff;
  border-radius: 14px;
  padding: 12px 4px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}
.num {
  font-size: 17px;
  font-weight: 700;
  color: #ff5c8a;
}
.num small {
  font-size: 10px;
  font-weight: 500;
  color: #9aa0ad;
  margin-left: 1px;
}
.lbl {
  font-size: 11px;
  color: #9aa0ad;
  margin-top: 4px;
}
.empty {
  margin-top: 60px;
}
.sec-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #4a4f5c;
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
  color: #ff5c8a;
}
.day-head .day-sum {
  font-size: 11px;
  color: #9aa0ad;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.no-data {
  color: #9aa0ad;
  font-size: 13px;
  text-align: center;
  padding: 40px 0;
}
.tl-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  cursor: pointer;
  transition: background 0.15s;
}
.tl-item:active {
  background: #fff0f5;
}
.tl-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #fff0f5;
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
}
.tl-sub {
  font-size: 12px;
  color: #9aa0ad;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tl-gap {
  display: inline-block;
  font-size: 11px;
  color: #ff7aa2;
  background: #fff0f5;
  border-radius: 8px;
  padding: 1px 7px;
  margin-top: 4px;
}
.tl-time {
  font-size: 12px;
  color: #b5bac6;
  flex: none;
}
.sheet-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 50;
}
.sheet {
  width: 100%;
  max-width: 480px;
  background: #f7f8fa;
  border-radius: 16px 16px 0 0;
  padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
  animation: sheetUp 0.2s ease;
}
@keyframes sheetUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
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
  color: #4a4f5c;
}
.sheet-x {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: #eceef3;
  color: #6b7180;
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
  color: #6b7180;
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
  border: 1px solid #e6e8ef;
  background: #fff;
  border-radius: 10px;
  padding: 10px;
  font-size: 13px;
  color: #4a4f5c;
  cursor: pointer;
}
.seg-btn.active {
  background: #fff0f5;
  border-color: #ff7aa2;
  color: #ff5c8a;
  font-weight: 600;
}
</style>
