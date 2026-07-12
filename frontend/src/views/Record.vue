<template>
  <div class="record">
    <header class="hd">
      <button class="back" type="button" aria-label="返回" @click="goHome">‹</button>
      <span class="title">记一笔</span>
      <span style="width: 40px"></span>
    </header>

    <div class="type-row" ref="typeRowRef" :class="{ sorting: sortMode }">
      <button
        v-for="(t, i) in orderedTypes"
        :key="t.value"
        :ref="(el) => setChipRef(el, i)"
        :class="['type-btn', { active: type === t.value, dragging: dragging === i }]"
        :style="chipStyle(i)"
        @click="selectType(t.value)"
      >
        <span v-if="sortMode" class="grip" @pointerdown.stop="onChipPointerDown(i, $event)">⋮⋮⋮</span>
        <span class="ti">{{ t.icon }}</span>{{ t.label }}
      </button>
      <button class="sort-toggle" type="button" @click="toggleSort">{{ sortMode ? '完成' : '排序' }}</button>
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

      <div class="field" v-if="type !== 'sleep'">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { useBabyStore } from '@/stores/baby'
import { createFeeding } from '@/api/feedings'
import { createSleep } from '@/api/sleeps'
import { createDiaper } from '@/api/diapers'
import { getHistory, pushHistory, removeHistory } from '@/utils/history'
import { tsToIso } from '@/utils/time'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const babyStore = useBabyStore()
const { currentBaby } = storeToRefs(babyStore)

function goHome() {
  router.replace('/')
}

type RecType = 'breast' | 'formula' | 'food' | 'bottle' | 'sleep' | 'diaper'
const types = [
  { value: 'breast', label: '母乳', icon: '🤱' },
  { value: 'formula', label: '配方奶', icon: '🥛' },
  { value: 'bottle', label: '瓶喂', icon: '🍼' },
  { value: 'food', label: '辅食', icon: '🍚' },
  { value: 'sleep', label: '睡眠', icon: '😴' },
  { value: 'diaper', label: '换尿布', icon: '💩' },
]
const diaperOpts = [
  { value: 'pee', label: '尿' },
  { value: 'poo', label: '便' },
  { value: 'both', label: '尿+便' },
]

// 记住上次选择的记录类型（仅类型，不带入数据）——存浏览器 localStorage
function loadLastType(): RecType {
  try {
    const v = localStorage.getItem('ml_last_type')
    if (v === 'breast' || v === 'formula' || v === 'bottle' || v === 'food' || v === 'sleep' || v === 'diaper') return v
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

// 排序模式 + 拖拽重排（Pointer Events，鼠标/触摸通用）
const sortMode = ref(false)
const dragging = ref(-1)
const dragDx = ref(0)
const targetIndex = ref(-1)
const chipEls: any[] = []
const typeRowRef = ref<HTMLElement | null>(null)
let pointerStartX = 0
let initialScrollLeft = 0
const snap = { gap: 8, dragW: 0 }

function setChipRef(el: any, i: number) {
  if (el) chipEls[i] = el
}
function selectType(v: RecType) {
  if (sortMode.value) return // 排序模式下点击不切换类型
  type.value = v
}
function toggleSort() {
  if (sortMode.value) saveTypeOrder()
  sortMode.value = !sortMode.value
  if (!sortMode.value) {
    dragging.value = -1
    dragDx.value = 0
    targetIndex.value = -1
  }
}
function onChipPointerDown(i: number, e: PointerEvent) {
  if (!sortMode.value) return
  e.preventDefault()
  dragging.value = i
  dragDx.value = 0
  targetIndex.value = i
  pointerStartX = e.clientX
  initialScrollLeft = typeRowRef.value?.scrollLeft || 0
  const rect = chipEls[i].getBoundingClientRect()
  snap.dragW = rect.width
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}
function onPointerMove(e: PointerEvent) {
  // 计算 dx 时补偿容器滚动：被拖元素始终保持在手指位置下方
  const scrollDelta = typeRowRef.value ? typeRowRef.value.scrollLeft - initialScrollLeft : 0
  const dx = (e.clientX - pointerStartX) + scrollDelta
  dragDx.value = dx

  // 自动滚动：手指靠近边缘时让容器滚动，使溢出部分可见
  if (typeRowRef.value) {
    const rowRect = typeRowRef.value.getBoundingClientRect()
    const edgeThreshold = 30
    if (e.clientX < rowRect.left + edgeThreshold && typeRowRef.value.scrollLeft > 0) {
      typeRowRef.value.scrollLeft -= 10
    } else if (e.clientX > rowRect.right - edgeThreshold) {
      typeRowRef.value.scrollLeft += 10
    }
  }

  // 每帧从 DOM 读取实时位置（含 transform 偏移 + 容器滚动），避免静态 snap 过时
  const liveRects = chipEls.map((el) => {
    const r = el.getBoundingClientRect()
    return { left: r.left, width: r.width, center: r.left + r.width / 2 }
  })
  if (!liveRects.length || dragging.value < 0 || dragging.value >= liveRects.length) return

  const draggedCenter = liveRects[dragging.value].center
  const others: { idx: number; center: number }[] = []
  liveRects.forEach((r, idx) => {
    if (idx !== dragging.value) others.push({ idx, center: r.center })
  })
  others.sort((a, b) => a.center - b.center)
  let insertAt = others.length
  for (let k = 0; k < others.length; k++) {
    if (draggedCenter < others[k].center) {
      insertAt = k
      break
    }
  }
  const newOrder = order.value.slice()
  const [moved] = newOrder.splice(dragging.value, 1)
  newOrder.splice(insertAt, 0, moved)
  targetIndex.value = newOrder.indexOf(moved)
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
  targetIndex.value = -1
  saveTypeOrder()
}
function chipStyle(i: number): Record<string, string> {
  if (!sortMode.value || dragging.value === -1) return {}
  if (dragging.value === i) {
    return { transform: `translateX(${dragDx.value}px)`, 'z-index': '10', position: 'relative' }
  }
  const d = dragging.value
  const t = targetIndex.value
  const inRange = d < t ? i > d && i <= t : i >= t && i < d
  if (!inRange) return {}
  const dir = d < t ? -1 : 1
  const shift = dir * (snap.dragW + snap.gap)
  return { transform: `translateX(${shift}px)` }
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
const amount = ref<number | null>(null)
const foodName = ref('')
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
}

onMounted(async () => {
  // 记录页可能是首屏（如在 /record 刷新），主动拉取宝宝，避免误判"未添加宝宝"
  if (!currentBaby.value) {
    try {
      await babyStore.fetch()
    } catch {
      /* 失败交给 submit 时再判断 */
    }
  }
})

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
    } else if (type.value === 'diaper') {
      await createDiaper({ babyId: currentBaby.value!.id, type: diaperType.value, note: note.value || null, occurred_at: occurredAt.value })
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
.type-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 12px;
  margin-bottom: 8px;
  scrollbar-width: none; /* Firefox 隐藏滚动条 */
  -ms-overflow-style: none; /* IE/旧 Edge 隐藏滚动条 */
}
.type-row::-webkit-scrollbar {
  display: none; /* WebKit（含移动端）隐藏滚动条，保留横向滑动 */
}
.type-btn {
  flex: none;
  border: 1px solid var(--border);
  background: var(--card);
  border-radius: 20px;
  padding: 8px 14px;
  font-size: 13px;
  color: var(--text-1);
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.type-btn.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}
.type-btn.active .grip {
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.15);
}
.type-btn.active .grip:active {
  background: rgba(255, 255, 255, 0.30);
}
.ti {
  font-size: 15px;
}
.type-row.sorting .type-btn {
  transition: transform 0.18s ease;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  cursor: default;
}
.type-row.sorting .type-btn.dragging {
  transition: none;
  cursor: grabbing;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  opacity: 0.95;
}
.grip {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--text-2);
  line-height: 1;
  padding: 4px 3px;
  margin-right: 4px;
  margin-left: -6px;
  border-radius: 6px;
  background: var(--border-soft);
  touch-action: none;
  cursor: grab;
  transition: background 0.15s;
}
.grip:active {
  background: var(--border);
}
.sort-toggle {
  flex: none;
  border: 1px dashed var(--border);
  background: transparent;
  border-radius: 20px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text-2);
  cursor: pointer;
}
.sort-toggle:active {
  color: var(--primary-deep);
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
