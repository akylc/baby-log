<template>
  <div class="record">
    <header class="hd">
      <button class="back" type="button" aria-label="返回" @click="goHome" @pointerup="goHome">‹</button>
      <span class="title">记一笔</span>
      <span style="width: 40px"></span>
    </header>

    <div class="type-pick">
      <div class="type-bar" :class="{ collapsed: !expanded && !sortMode, sorting: sortMode }" ref="typeRowRef">
        <button
          v-for="(t, i) in orderedTypes"
          :key="t.value"
          :ref="(el) => setChipRef(el, i)"
          :class="['type-chip', { active: type === t.value, dragging: dragging === i }]"
          :style="chipStyle(i)"
          @click="selectType(t.value)"
        >
          <span class="ti">{{ t.icon }}</span><span class="tl">{{ t.label }}</span>
          <span v-if="sortMode" class="grip" @pointerdown.stop="onChipPointerDown(i, $event)">⠿</span>
        </button>
        <button
          v-if="expanded || sortMode"
          class="sort-toggle"
          type="button"
          @click="sortMode ? finishSort() : openSort()"
        >{{ sortMode ? '完成' : '排序' }}</button>
      </div>
      <div class="type-actions">
        <button class="expand-btn" type="button" @click="toggleExpand">
          <span>{{ expanded ? '收起' : '展开' }}</span>
          <span class="chev" :class="{ up: expanded }">▾</span>
        </button>
      </div>
    </div>

    <section class="form">
      <template v-if="type === 'breast'">
        <div class="field">
          <label>左乳时长（分钟）<span class="req">*</span></label>
          <n-input-number v-model:value="leftDuration" :min="0" :max="240" placeholder="如 15" />
          <div class="hist" v-if="hist.breast_left.length">
            <span class="hist-cap">最近（长按删除）</span>
            <span
              v-for="h in hist.breast_left"
              :key="h"
              class="tag"
              @click="fillVal('breast_left', h)"
              @touchstart.passive="onTagPressStart('breast_left', h)"
              @touchend="onTagPressEnd"
              @touchmove="onTagPressEnd"
              @touchcancel="onTagPressEnd"
              @contextmenu.prevent="askDelete('breast_left', h)"
            >{{ h }}</span>
          </div>
        </div>
        <div class="field">
          <label>右乳时长（分钟）<span class="req">*</span></label>
          <n-input-number v-model:value="rightDuration" :min="0" :max="240" placeholder="如 15" />
          <div class="hist" v-if="hist.breast_right.length">
            <span class="hist-cap">最近（长按删除）</span>
            <span
              v-for="h in hist.breast_right"
              :key="h"
              class="tag"
              @click="fillVal('breast_right', h)"
              @touchstart.passive="onTagPressStart('breast_right', h)"
              @touchend="onTagPressEnd"
              @touchmove="onTagPressEnd"
              @touchcancel="onTagPressEnd"
              @contextmenu.prevent="askDelete('breast_right', h)"
            >{{ h }}</span>
          </div>
        </div>
      </template>

      <template v-else-if="type === 'formula'">
        <div class="field">
          <label>奶量（ml）<span class="req">*</span></label>
          <n-input-number v-model:value="amount" :min="0" :max="500" placeholder="如 120" />
          <div class="hist" v-if="hist.milk_amount.length">
            <span class="hist-cap">最近（长按删除）</span>
            <span
              v-for="h in hist.milk_amount"
              :key="h"
              class="tag"
              @click="fillVal('milk_amount', h)"
              @touchstart.passive="onTagPressStart('milk_amount', h)"
              @touchend="onTagPressEnd"
              @touchmove="onTagPressEnd"
              @touchcancel="onTagPressEnd"
              @contextmenu.prevent="askDelete('milk_amount', h)"
            >{{ h }}</span>
          </div>
        </div>
      </template>

      <template v-else-if="type === 'bottle'">
        <div class="field">
          <label>奶量（ml）<span class="req">*</span></label>
          <n-input-number v-model:value="amount" :min="0" :max="500" placeholder="如 120" />
          <div class="hist" v-if="hist.milk_amount.length">
            <span class="hist-cap">最近（长按删除）</span>
            <span
              v-for="h in hist.milk_amount"
              :key="h"
              class="tag"
              @click="fillVal('milk_amount', h)"
              @touchstart.passive="onTagPressStart('milk_amount', h)"
              @touchend="onTagPressEnd"
              @touchmove="onTagPressEnd"
              @touchcancel="onTagPressEnd"
              @contextmenu.prevent="askDelete('milk_amount', h)"
            >{{ h }}</span>
          </div>
        </div>
      </template>

      <template v-else-if="type === 'food'">
        <div class="field">
          <label>辅食名称<span class="req">*</span></label>
          <n-input v-model:value="foodName" placeholder="如 米粉、南瓜泥" />
          <div class="hist" v-if="hist.food_name.length">
            <span class="hist-cap">最近（长按删除）</span>
            <span
              v-for="h in hist.food_name"
              :key="h"
              class="tag"
              @click="fillVal('food_name', h)"
              @touchstart.passive="onTagPressStart('food_name', h)"
              @touchend="onTagPressEnd"
              @touchmove="onTagPressEnd"
              @touchcancel="onTagPressEnd"
              @contextmenu.prevent="askDelete('food_name', h)"
            >{{ h }}</span>
          </div>
        </div>
      </template>

      <template v-else-if="type === 'supplement'">
        <div class="field">
          <label>补剂名称<span class="req">*</span></label>
          <n-input v-model:value="supplementName" placeholder="如 维生素D、DHA" />
          <div class="hist" v-if="supplementPresets.length">
            <span class="hist-cap">常见补剂（点击填入）</span>
            <span
              v-for="p in supplementPresets"
              :key="p"
              class="tag preset"
              @click="supplementName = p"
            >{{ p }}</span>
          </div>
          <div class="hist" v-if="hist.supplement_name.length">
            <span class="hist-cap">最近（长按删除）</span>
            <span
              v-for="h in hist.supplement_name"
              :key="h"
              class="tag"
              @click="fillVal('supplement_name', h)"
              @touchstart.passive="onTagPressStart('supplement_name', h)"
              @touchend="onTagPressEnd"
              @touchmove="onTagPressEnd"
              @touchcancel="onTagPressEnd"
              @contextmenu.prevent="askDelete('supplement_name', h)"
            >{{ h }}</span>
          </div>
        </div>
      </template>

      <template v-else-if="type === 'sleep'">
        <div class="field">
          <label>入睡时间<span class="req">*</span></label>
          <n-date-picker v-model:value="sleepStart" type="datetime" format="yyyy-MM-dd HH:mm" input-readonly />
        </div>
        <div class="field">
          <label>醒来时间（选填）</label>
          <n-date-picker v-model:value="sleepEnd" type="datetime" format="yyyy-MM-dd HH:mm" input-readonly />
        </div>
        <div class="field" v-if="sleepStart && sleepEnd && calcSleepMin > 0">
          <label>睡眠时长（自动计算）</label>
          <div class="sleep-dur-auto">{{ sleepDurText }}</div>
        </div>
      </template>

      <template v-else-if="type === 'play'">
        <div class="field">
          <label>娱乐类型<span class="req">*</span></label>
          <n-input v-model:value="playType" placeholder="如 爬爬垫、散步" />
          <div class="hist" v-if="playPresets.length">
            <span class="hist-cap">常见娱乐（点击填入）</span>
            <span
              v-for="p in playPresets"
              :key="p"
              class="tag preset"
              @click="playType = p"
            >{{ p }}</span>
          </div>
          <div class="hist" v-if="hist.play_type.length">
            <span class="hist-cap">最近（长按删除）</span>
            <span
              v-for="h in hist.play_type"
              :key="h"
              class="tag"
              @click="fillVal('play_type', h)"
              @touchstart.passive="onTagPressStart('play_type', h)"
              @touchend="onTagPressEnd"
              @touchmove="onTagPressEnd"
              @touchcancel="onTagPressEnd"
              @contextmenu.prevent="askDelete('play_type', h)"
            >{{ h }}</span>
          </div>
        </div>
        <div class="field">
          <label>开始时间（选填）</label>
          <n-date-picker v-model:value="playStart" type="datetime" format="yyyy-MM-dd HH:mm" input-readonly />
        </div>
        <div class="field">
          <label>结束时间（选填）</label>
          <n-date-picker v-model:value="playEnd" type="datetime" format="yyyy-MM-dd HH:mm" input-readonly />
        </div>
        <div class="field" v-if="playStart && playEnd && calcPlayMin > 0">
          <label>娱乐时长（自动计算）</label>
          <div class="sleep-dur-auto">{{ playDurText }}</div>
        </div>
      </template>

      <template v-else-if="type === 'diaper'">
        <div class="field">
          <label>类型</label>
          <div class="seg">
            <button
              v-for="o in diaperOpts"
              :key="o.value"
              :class="['seg-btn', { active: diaperType === o.value }]"
              @click="diaperType = o.value"
            >
              {{ o.label }}
            </button>
          </div>
        </div>
      </template>

      <div class="field" v-if="type !== 'sleep' && type !== 'play'">
        <label>时间</label>
        <n-date-picker v-model:value="occurredTs" type="datetime" format="yyyy-MM-dd HH:mm" input-readonly />
      </div>
      <div class="field">
        <label>备注（可选）</label>
        <n-input
          v-model:value="note"
          type="textarea"
          placeholder="想记点什么…"
          :autosize="{ minRows: 2, maxRows: 4 }"
        />
      </div>

      <n-button type="primary" block size="large" :loading="loading" @click="submit">保存记录</n-button>
    </section>

    <!-- 径向扇形类型切换（右下角，独立于上方类型栏） -->
    <PieTypeMenu :items="orderedTypes" :current="type" @select="selectType" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch, onBeforeUnmount } from 'vue'
import { useRevealRefresh } from '@/utils/reveal'
import { useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { useBabyStore } from '@/stores/baby'
import { createFeeding } from '@/api/feedings'
import { createSleep } from '@/api/sleeps'
import { createPlay } from '@/api/plays'
import { createDiaper } from '@/api/diapers'
import { createCare } from '@/api/cares'
import { getHistory, pushHistory, removeHistory } from '@/utils/history'
import { tsToIso } from '@/utils/time'
import PieTypeMenu from '@/components/PieTypeMenu.vue'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const babyStore = useBabyStore()
const { currentBaby } = storeToRefs(babyStore)

let lastNavAt = 0
function goHome() {
  const now = Date.now()
  if (now - lastNavAt < 800) return
  lastNavAt = now
  router.replace('/')
}

type RecType = 'breast' | 'formula' | 'food' | 'bottle' | 'supplement' | 'sleep' | 'play' | 'diaper' | 'bath' | 'haircut' | 'nails'
const types = [
  { value: 'breast', label: '母乳', icon: '🤱' },
  { value: 'formula', label: '配方奶', icon: '🥛' },
  { value: 'bottle', label: '瓶喂母乳', icon: '🍼' },
  { value: 'food', label: '辅食', icon: '🍚' },
  { value: 'supplement', label: '营养补剂', icon: '💊' },
  { value: 'sleep', label: '睡眠', icon: '😴' },
  { value: 'play', label: '娱乐', icon: '🎡' },
  { value: 'diaper', label: '换尿布', icon: '💩' },
  { value: 'bath', label: '洗澡', icon: '🛁' },
  { value: 'haircut', label: '理发', icon: '💇' },
  { value: 'nails', label: '剪指甲', icon: '✂️' },
]
const diaperOpts = [
  { value: 'pee', label: '尿' },
  { value: 'poo', label: '便' },
  { value: 'both', label: '尿+便' },
]
// 营养补剂常见快捷选项（点击填入补剂名称，非历史记录）
const supplementPresets = ['维生素D', '维生素AD', 'DHA', '钙', '铁', '锌', '益生菌', '鱼油']
// 娱乐常见快捷选项（点击填入娱乐类型，非历史记录）
const playPresets = ['爬爬垫', '散步', '户外娱乐', '早教', '唱歌', '讲故事', '积木', '游戏']

// 记住上次选择的记录类型（仅类型，不带入数据）——存浏览器 localStorage
function loadLastType(): RecType {
  try {
    const v = localStorage.getItem('ml_last_type')
    if (v === 'breast' || v === 'formula' || v === 'bottle' || v === 'food' || v === 'supplement' || v === 'sleep' || v === 'play' || v === 'diaper' || v === 'bath' || v === 'haircut' || v === 'nails') return v
  } catch {
    /* 忽略存储异常 */
  }
  return 'breast'
}
const type = ref<RecType>(loadLastType())
watch(type, (v) => {
  try {
    localStorage.setItem('ml_last_type', v)
  } catch {
    /* 忽略存储异常 */
  }
})

// 类型选项顺序：支持「排序」模式下拖拽重排，顺序持久化到 localStorage
const TYPE_VALUES = types.map((t) => t.value)
function loadTypeOrder(): string[] {
  try {
    const raw = localStorage.getItem('ml_type_order')
    if (raw) {
      const arr = JSON.parse(raw)
      if (
        Array.isArray(arr) &&
        arr.length === TYPE_VALUES.length &&
        arr.every((v) => TYPE_VALUES.includes(v))
      ) {
        return arr
      }
    }
  } catch {
    /* 忽略存储异常 */
  }
  return TYPE_VALUES.slice()
}
const order = ref<string[]>(loadTypeOrder())
const orderedTypes = computed(() => order.value.map((v) => types.find((t) => t.value === v)!).filter(Boolean))
function saveTypeOrder() {
  try {
    localStorage.setItem('ml_type_order', JSON.stringify(order.value))
  } catch {
    /* 忽略存储异常 */
  }
}

// 类型选择：折叠触发 → 展开网格选择；「排序」模式下在网格内拖拽重排（Pointer Events，鼠标/触摸通用）
const expanded = ref(false)
const sortMode = ref(false)
const dragging = ref(-1)
const dragDx = ref(0)
const dragDy = ref(0)
const targetIndex = ref(-1)
const chipEls: any[] = []
const typeRowRef = ref<HTMLElement | null>(null)
let pointerStartX = 0
let pointerStartY = 0

function setChipRef(el: any, i: number) {
  if (el) chipEls[i] = el
}
function toggleExpand() {
  if (sortMode.value) {
    finishSort() // 排序中再次点击折叠 → 视为完成排序
    return
  }
  expanded.value = !expanded.value
}
function selectType(v: RecType) {
  if (sortMode.value) return // 排序模式下点击不切换类型
  type.value = v
  expanded.value = false // 选完即收起
}
function openSort() {
  expanded.value = true
  sortMode.value = true
}
function finishSort() {
  if (sortMode.value) saveTypeOrder()
  sortMode.value = false
  expanded.value = false
  dragging.value = -1
  dragDx.value = 0
  dragDy.value = 0
  targetIndex.value = -1
}
function onChipPointerDown(i: number, e: PointerEvent) {
  if (!sortMode.value) return
  e.preventDefault()
  dragging.value = i
  dragDx.value = 0
  dragDy.value = 0
  targetIndex.value = i
  pointerStartX = e.clientX
  pointerStartY = e.clientY
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}
function onPointerMove(e: PointerEvent) {
  if (dragging.value < 0) return
  dragDx.value = e.clientX - pointerStartX
  dragDy.value = e.clientY - pointerStartY
  // 每帧从 DOM 读取实时中心，找最近的其它格子作为插入目标（2D 最近邻，行列通吃）
  const liveRects = chipEls.map((el) => {
    const r = el.getBoundingClientRect()
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 }
  })
  if (!liveRects.length || dragging.value >= liveRects.length) return
  // liveRects[dragging.value] 已经是 transform 之后的实时位置（getBoundingClientRect 含 transform），
  // 不要再叠加 dragDx/dragDy，否则落点被放大一倍，跨行拖动会错位（如第三排拖到第二排却落到第一排）。
  const cur = {
    cx: liveRects[dragging.value].cx,
    cy: liveRects[dragging.value].cy,
  }
  let best = -1
  let bestDist = Infinity
  liveRects.forEach((r, idx) => {
    if (idx === dragging.value) return
    const d = Math.hypot(r.cx - cur.cx, r.cy - cur.cy)
    if (d < bestDist) {
      bestDist = d
      best = idx
    }
  })
  targetIndex.value = best
}
function onPointerUp() {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
  const from = dragging.value
  const to = targetIndex.value
  if (from !== -1 && to !== -1 && from !== to) {
    const newOrder = order.value.slice()
    const [moved] = newOrder.splice(from, 1)
    newOrder.splice(to, 0, moved)
    order.value = newOrder
  }
  dragging.value = -1
  dragDx.value = 0
  dragDy.value = 0
  targetIndex.value = -1
  saveTypeOrder()
}
function chipStyle(i: number): Record<string, string> {
  if (sortMode.value && dragging.value === i) {
    return {
      transform: `translate(${dragDx.value}px, ${dragDy.value}px)`,
      'z-index': '20',
      position: 'relative',
    }
  }
  return {}
}
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
})

const diaperType = ref<'pee' | 'poo' | 'both'>('pee')
const leftDuration = ref<number | null>(null)
const rightDuration = ref<number | null>(null)
const sleepStart = ref<number>(Date.now())
const sleepEnd = ref<number | null>(null)
const playType = ref('')
const playStart = ref<number>(Date.now())
const playEnd = ref<number | null>(null)
const calcSleepMin = computed(() => {
  if (!sleepStart.value || !sleepEnd.value) return 0
  const diffMs = sleepEnd.value - sleepStart.value
  if (diffMs <= 0) return 0
  return Math.ceil(diffMs / 60000)
})
const sleepDurText = computed(() => {
  const m = calcSleepMin.value
  if (!m) return ''
  const h = Math.floor(m / 60)
  const r = m % 60
  if (h > 0 && r > 0) return `共 ${h} 小时 ${r} 分钟`
  if (h > 0) return `共 ${h} 小时`
  return `共 ${m} 分钟`
})
const calcPlayMin = computed(() => {
  if (!playStart.value || !playEnd.value) return 0
  const diffMs = playEnd.value - playStart.value
  if (diffMs <= 0) return 0
  return Math.ceil(diffMs / 60000)
})
const playDurText = computed(() => {
  const m = calcPlayMin.value
  if (!m) return ''
  const h = Math.floor(m / 60)
  const r = m % 60
  if (h > 0 && r > 0) return `共 ${h} 小时 ${r} 分钟`
  if (h > 0) return `共 ${h} 小时`
  return `共 ${m} 分钟`
})
const amount = ref<number | null>(null)
const foodName = ref('')
const supplementName = ref('')
const note = ref('')
const occurredTs = ref(Date.now())
const loading = ref(false)

const occurredAt = computed(() => tsToIso(occurredTs.value))

// 历史输入标签：按字段缓存到 localStorage，点击可快速填入
const hist = reactive<Record<string, string[]>>({
  breast_left: getHistory('breast_left'),
  breast_right: getHistory('breast_right'),
  milk_amount: getHistory('milk_amount'),
  food_name: getHistory('food_name'),
  supplement_name: getHistory('supplement_name'),
  play_type: getHistory('play_type'),
})
function recordHist(key: string, val: number | string | null) {
  if (val === null || val === undefined || val === '') return
  if (typeof val === 'number' && Number.isNaN(val)) return
  pushHistory(key, val)
  hist[key] = getHistory(key)
}
function deleteHist(key: string, val: string) {
  hist[key] = removeHistory(key, val)
}

// 最近 tag：轻点填入数值；长按（移动端）/ 右键（桌面端）弹出确认后删除，
// 避免移动端误触常驻删除按钮直接删掉历史项。
let pressTimer: ReturnType<typeof setTimeout> | null = null
let longPressed = false
let dialogOpen = false

function onTagPressStart(key: string, val: string) {
  longPressed = false
  if (pressTimer) clearTimeout(pressTimer)
  pressTimer = setTimeout(() => {
    pressTimer = null
    longPressed = true
    askDelete(key, val)
  }, 500)
}
function onTagPressEnd() {
  if (pressTimer) {
    clearTimeout(pressTimer)
    pressTimer = null
  }
}
function askDelete(key: string, val: string) {
  if (dialogOpen) return
  dialogOpen = true
  dialog.warning({
    title: '删除历史记录',
    content: `确定从快捷选项中删除「${val}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => deleteHist(key, val),
    onAfterLeave: () => {
      dialogOpen = false
    },
  })
}
function fillVal(key: string, val: string) {
  // 若是长按触发的删除，则本次抬起后的 click 不再填入
  if (longPressed) {
    longPressed = false
    return
  }
  if (key === 'breast_left') leftDuration.value = Number(val)
  else if (key === 'breast_right') rightDuration.value = Number(val)
  else if (key === 'milk_amount') amount.value = Number(val)
  else if (key === 'food_name') foodName.value = val
  else if (key === 'supplement_name') supplementName.value = val
  else if (key === 'play_type') playType.value = val
}

async function reload() {
  // 切回前台：把记录时间重置为「此刻」（用户此刻才记录，避免停留在切后台前的时间）
  occurredTs.value = Date.now()
  if (type.value === 'sleep') sleepStart.value = Date.now()
  if (type.value === 'play') playStart.value = Date.now()
  // 记录页可能是首屏（如在 /record 刷新），主动拉取宝宝，避免误判"未添加宝宝"
  if (!currentBaby.value) {
    try {
      await babyStore.fetch()
    } catch {
      /* 失败交给 submit 时再判断 */
    }
  }
}
onMounted(reload)
// 从后台切回前台时刷新当前页面
useRevealRefresh(reload)

async function submit() {
  if (!currentBaby.value) {
    // 兜底：提交前再确认一次服务端是否已有宝宝
    try {
      await babyStore.fetch()
    } catch {
      /* ignore */
    }
  }
  if (!currentBaby.value) {
    message.warning('请先在「我的」创建宝宝')
    router.push('/baby')
    return
  }
  loading.value = true
  try {
    if (type.value === 'breast') {
      if (!leftDuration.value && !rightDuration.value) {
        message.warning('请填写母乳时长（左乳或右乳至少一项）')
        loading.value = false
        return
      }
      if (leftDuration.value) recordHist('breast_left', leftDuration.value)
      if (rightDuration.value) recordHist('breast_right', rightDuration.value)
      await createFeeding({ babyId: currentBaby.value!.id, type: 'breast', left_duration_min: leftDuration.value, right_duration_min: rightDuration.value, note: note.value || null, occurred_at: occurredAt.value })
    } else if (type.value === 'formula') {
      if (!amount.value || amount.value <= 0) {
        message.warning('请填写奶量')
        loading.value = false
        return
      }
      recordHist('milk_amount', amount.value)
      await createFeeding({ babyId: currentBaby.value!.id, type: 'formula', amount_ml: amount.value, note: note.value || null, occurred_at: occurredAt.value })
    } else if (type.value === 'bottle') {
      if (!amount.value || amount.value <= 0) {
        message.warning('请填写奶量')
        loading.value = false
        return
      }
      recordHist('milk_amount', amount.value)
      await createFeeding({ babyId: currentBaby.value!.id, type: 'bottle', amount_ml: amount.value, note: note.value || null, occurred_at: occurredAt.value })
    } else if (type.value === 'food') {
      if (!foodName.value || !foodName.value.trim()) {
        message.warning('请填写辅食名称')
        loading.value = false
        return
      }
      recordHist('food_name', foodName.value.trim())
      await createFeeding({ babyId: currentBaby.value!.id, type: 'food', food_name: foodName.value.trim(), note: note.value || null, occurred_at: occurredAt.value })
    } else if (type.value === 'supplement') {
      const name = supplementName.value.trim()
      if (!name) {
        message.warning('请填写补剂名称')
        loading.value = false
        return
      }
      // 命中常见补剂（点击常见补剂即可填入，无需再堆进「最近」标签）
      if (!supplementPresets.includes(name)) {
        recordHist('supplement_name', name)
      }
      await createFeeding({ babyId: currentBaby.value!.id, type: 'supplement', supplement_name: name, note: note.value || null, occurred_at: occurredAt.value })
    } else if (type.value === 'sleep') {
      if (!sleepStart.value) {
        message.warning('请填写入睡时间')
        loading.value = false
        return
      }
      const payload: any = { babyId: currentBaby.value!.id, sleep_start: tsToIso(sleepStart.value), note: note.value || null }
      if (sleepEnd.value && calcSleepMin.value > 0) {
        payload.sleep_end = tsToIso(sleepEnd.value)
      }
      await createSleep(payload)
    } else if (type.value === 'play') {
      const name = playType.value.trim()
      if (!name) {
        message.warning('请填写娱乐类型')
        loading.value = false
        return
      }
      // 命中常见娱乐（点击常见娱乐即可填入，无需再堆进「最近」标签）
      if (!playPresets.includes(name)) {
        recordHist('play_type', name)
      }
      const payload: any = { babyId: currentBaby.value!.id, play_type: name, note: note.value || null }
      // 开始时间选填：未填则以当前时间记录（与睡眠类型一致，后端以当前时间作为 occurred_at）
      if (playStart.value) payload.play_start = tsToIso(playStart.value)
      if (playEnd.value && calcPlayMin.value > 0) {
        payload.play_end = tsToIso(playEnd.value)
      }
      await createPlay(payload)
    } else if (type.value === 'diaper') {
      await createDiaper({ babyId: currentBaby.value!.id, type: diaperType.value, note: note.value || null, occurred_at: occurredAt.value })
    } else if (type.value === 'bath' || type.value === 'haircut' || type.value === 'nails') {
      // 护理类（洗澡 / 理发 / 剪指甲）：仅需时间与备注，无其他结构化数据
      await createCare({ babyId: currentBaby.value!.id, care_type: type.value, note: note.value || null, occurred_at: occurredAt.value })
    }
    message.success('已记录 🎉')
    router.replace('/')
  } catch (e: any) {
    message.error(e?.message || '保存失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.record {
  position: relative;
  min-height: 100%;
  padding: 12px 16px 24px;
}
.hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.title {
  font-size: 16px;
  font-weight: 600;
}
.back {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: var(--text-1);
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: -8px;
}
.type-pick {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
}
/* 折叠态：单行横向排列、可横向滑动（溢出可滑）；展开/排序态：自动换行向下展开 */
.type-bar {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  padding: 0;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.type-bar::-webkit-scrollbar {
  display: none;
}
.type-bar:not(.collapsed) {
  flex-wrap: wrap;
  overflow: visible;
}
.type-chip {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--border);
  background: var(--card);
  border-radius: 20px;
  padding: 8px 14px;
  font-size: 13px;
  color: var(--text-1);
  cursor: pointer;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s;
}
.type-chip.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}
.type-chip .ti {
  font-size: 15px;
  line-height: 1;
}
.type-chip.dragging {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.22);
  opacity: 0.95;
  cursor: grabbing;
  z-index: 20;
}
.grip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  font-size: 15px;
  line-height: 1;
  color: var(--text-2);
  padding: 4px 6px;
  border-radius: 6px;
  background: var(--border-soft);
  touch-action: none;
  cursor: grab;
}
.type-chip.active .grip {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.2);
}
.type-actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
}
.sort-toggle {
  border: 1px dashed var(--border);
  background: transparent;
  border-radius: 20px;
  padding: 8px 14px;
  font-size: 13px;
  color: var(--text-2);
  cursor: pointer;
  white-space: nowrap;
}
.sort-toggle:active {
  color: var(--primary-deep);
}
.expand-btn {
  border: 1px solid var(--border);
  background: var(--card);
  border-radius: 20px;
  padding: 8px 14px;
  font-size: 13px;
  color: var(--text-2);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
}
.expand-btn:active {
  color: var(--primary-deep);
}
.expand-btn .chev {
  font-size: 10px;
  transition: transform 0.2s ease;
}
.expand-btn .chev.up {
  transform: rotate(180deg);
}
.sleep-dur-auto {
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-deep);
  padding: 8px 0 2px;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field label {
  font-size: 13px;
  color: var(--text-2);
}
.req {
  color: var(--primary-deep);
  margin-left: 2px;
}
.hist {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}
.hist-cap {
  font-size: 12px;
  color: var(--text-3);
}
.tag {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--tag-border);
  background: var(--tag-bg);
  color: var(--tag-text);
  border-radius: 14px;
  padding: 6px 14px;
  font-size: 13px;
  line-height: 1.4;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  touch-action: manipulation; /* 去移动端双击缩放/点击延迟 */
  transition: background 0.15s;
}
.tag:active {
  background: var(--card-pink);
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
</style>
