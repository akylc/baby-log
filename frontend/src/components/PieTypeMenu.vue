<template>
  <!-- 按住右下角圆形按钮 → 扇形径向展开全部类型 → 滑动到目标松开即切换 -->
  <div class="pie" ref="wrapRef">
    <!-- 扇形展开时的背景模糊层：以入口为圆心的圆，直径随最外圈动态放大，模糊覆盖全部扇形项 -->
    <div class="pie-scrim" :class="{ show: open }" :style="{ width: scrimSize + 'px', height: scrimSize + 'px' }" aria-hidden="true"></div>
    <!-- 滑动引导线：从入口按钮中心(半透明)到手指位置(不透明) -->
    <svg v-if="open && lineActive" class="pie-line" width="0" height="0" aria-hidden="true">
      <defs>
        <linearGradient
          :id="gradId"
          gradientUnits="userSpaceOnUse"
          :x1="0" :y1="0" :x2="fingerX" :y2="fingerY"
        >
          <stop offset="0%" :stop-color="lineColor" stop-opacity="0.1" />
          <stop offset="100%" :stop-color="lineColor" stop-opacity="0.9" />
        </linearGradient>
      </defs>
      <line
        :x1="0" :y1="0" :x2="fingerX" :y2="fingerY"
        :stroke="`url(#${gradId})`"
        stroke-width="4"
        stroke-linecap="round"
      />
      <circle :cx="fingerX" :cy="fingerY" r="5" :fill="lineColor" fill-opacity="0.9" />
    </svg>
    <button class="pie-center" type="button" :aria-label="`扇形切换：${currentLabel}`" @pointerdown.prevent="start">
      <span class="pc-ico">{{ currentIcon }}</span>
    </button>
    <button
      v-for="(it, i) in items"
      :key="it.value"
      class="pie-item"
      :class="{ open: open, hover: hoverIdx === i }"
      :style="itemStyle(i, it.value)"
      type="button"
      tabindex="-1"
    >
      <span class="pi-ico">{{ it.icon }}</span>
      <span class="pi-lab">{{ it.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'

interface PieItem {
  value: string
  label: string
  icon: string
}

const props = defineProps<{
  items: PieItem[]
  current: string
}>()
const emit = defineEmits<{ (e: 'select', value: string): void }>()

const open = ref(false)
const hoverIdx = ref(-1)
const wrapRef = ref<HTMLElement | null>(null)
// 返回激活锁：从其他页返回首页后，屏蔽 iOS 书签模式穿透来的合成 pointerdown 误触发展开
let guardUntil = 0

// 滑动引导线：手指相对入口中心的偏移；lineActive 表示手指已移动、可绘线
const fingerX = ref(0)
const fingerY = ref(0)
const lineActive = ref(false)
const gradId = `pie-line-grad-${Math.random().toString(36).slice(2, 8)}`
// 线条颜色：命中某项时用该类型主题色，否则回退主色
const lineColor = computed(() =>
  hoverIdx.value >= 0
    ? `var(--t-${props.items[hoverIdx.value].value}, var(--primary))`
    : 'var(--primary)',
)

const RING_CAP = [3, 5] // 每圈容量：第一圈（内圈）3 个，第二圈 5 个；更多则每圈 5 个
const SECTOR = 90 // 扇形总张角（度）：从正上方张到正左方，朝页面内部展开
const RING0 = 112 // 第一圈半径 px
const RING_GAP = 96 // 每加一圈半径增量
const HIT = 40 // 命中半径 px

function capForRing(ring: number) {
  return RING_CAP[ring] ?? 5
}

// 扇形布局：朝页面内部（左上）张开的 90° 扇面，从“正上方”到“正左方”
// 每圈按各自容量在扇面内均匀排布，按钮在右下角时所有展开项都在可视区内
const layout = computed(() => {
  const n = props.items.length
  const arr: { x: number; y: number }[] = []
  let i = 0
  let ring = 0
  while (i < n) {
    const cap = capForRing(ring)
    const countInRing = Math.min(cap, n - i)
    const R = RING0 + ring * RING_GAP
    for (let k = 0; k < countInRing; k++) {
      // φ∈[0, π/2]：0=正上方，π/2=正左方；在本圈数量内均匀分布
      const phi = countInRing <= 1 ? 0 : (k / (countInRing - 1)) * (Math.PI / 2)
      arr.push({ x: -Math.sin(phi) * R, y: -Math.cos(phi) * R })
      i++
    }
    ring++
  }
  return arr
})

// 背景模糊圆直径：取最外圈扇形项到入口的距离 + 余量(让项外围背景也模糊)，
// 保证所有圈(含第三圈及以上)的背景都被模糊覆盖，而非只糊前几圈
const scrimRadius = computed(() => {
  const maxR = layout.value.reduce((m, p) => Math.max(m, Math.hypot(p.x, p.y)), 0)
  return maxR + 130
})
const scrimSize = computed(() => scrimRadius.value * 2)

const currentItem = computed(() => props.items.find((t) => t.value === props.current))
const currentIcon = computed(() => currentItem.value?.icon ?? '⊕')
const currentLabel = computed(() => currentItem.value?.label ?? '类型')

function itemStyle(i: number, value: string) {
  const p = layout.value[i]
  const scale = open.value ? (hoverIdx.value === i ? 1.18 : 1) : 0
  const tf = open.value
    ? `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px)) scale(${scale})`
    : `translate(-50%, -50%) scale(0)`
  return {
    transform: tf,
    opacity: open.value ? 1 : 0,
    // 用类型主题色做底色 tint，缺省回退主色
    background: `color-mix(in srgb, var(--t-${value}, var(--primary)) 16%, var(--card))`,
    color: `var(--t-${value}, var(--primary))`,
    pointerEvents: open.value ? 'auto' : 'none',
  } as any
}

// 根据指针坐标更新引导线终点与命中项（移动端拖动 / PC hover 共用）
function updateFromPoint(clientX: number, clientY: number) {
  if (!wrapRef.value) return
  const r = wrapRef.value.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  const px = clientX - cx
  const py = clientY - cy
  fingerX.value = px
  fingerY.value = py
  // 离开中心一定距离才画线，避免刚按下/刚展开时出现极短线段
  lineActive.value = Math.hypot(px, py) > 12
  let best = -1
  let bestD = Infinity
  layout.value.forEach((p, i) => {
    const d = Math.hypot(px - p.x, py - p.y)
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  hoverIdx.value = bestD <= HIT ? best : -1
}

// 滑动选择：按住入口拖动到目标，松开即选择（引导线在拖动时显示）
function onMove(e: PointerEvent) {
  updateFromPoint(e.clientX, e.clientY)
}
function onUp() {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  window.removeEventListener('pointercancel', onUp)
  if (hoverIdx.value >= 0) emit('select', props.items[hoverIdx.value].value)
  open.value = false
  hoverIdx.value = -1
  lineActive.value = false
  fingerX.value = 0
  fingerY.value = 0
  document.body.style.userSelect = ''
}
function start(e: PointerEvent) {
  // 屏蔽 iOS 书签从添加页返回首页时，返回手势合成 pointerdown 落在本入口误触发展开
  if (Date.now() < guardUntil) return
  e.preventDefault()
  // 拖动期间禁止文本选区（避免按住扇形按钮拖动时选中背后页面文本）
  window.getSelection()?.removeAllRanges()
  document.body.style.userSelect = 'none'
  open.value = true
  hoverIdx.value = -1
  lineActive.value = false
  fingerX.value = 0
  fingerY.value = 0
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
}
// 组件卸载（如扇形菜单展开中触发侧滑返回）时移除 window 上的全局指针监听，
// 避免监听器泄漏到首页、干扰返回页的点击事件
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  window.removeEventListener('pointercancel', onUp)
  document.body.style.userSelect = ''
})
// 由父组件在从其他页(如添加记录)返回首页时调用，屏蔽返回穿透误触发的扇形展开（iOS 书签）
function armGuard() {
  guardUntil = Date.now() + 700
}
defineExpose({ armGuard })
</script>

<style scoped>
.pie {
  position: fixed;
  /* 对齐「首页添加按钮 .fab」的中心：FAB 为 56px，right/bottom 定位其边缘，
     故锚点需外移半宽(28px)以重合 FAB 中心，避免入口按钮偏右下、超出页面 */
  right: calc(50% - 240px + 48px);
  bottom: calc(52px + env(safe-area-inset-bottom));
  width: 0;
  height: 0;
  z-index: 1000;
  user-select: none;
  -webkit-user-select: none;
}
@media (max-width: 480px) {
  .pie {
    right: 48px;
  }
}
/* 背景模糊层：以入口(0,0)为圆心、直径由 scrimSize 动态给出的圆，展开时淡入。
   只模糊扇形展开区域(圆形)的背景，menu 项(z-index:2)在其上层保持清晰。
   mask 渐隐推到圆边缘(100%)，使模糊有效区覆盖最外圈(含第三圈及以上)而非提前消失。 */
.pie-scrim {
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 50%;
  z-index: 0; /* 页面内容之上、引导线与菜单项之下 */
  pointer-events: none;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.55);
  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(7px);
  /* 中心略加一层卡片色薄纱、向外柔和淡出，使扇形聚焦而不显生硬 */
  background: radial-gradient(circle closest-side,
    color-mix(in srgb, var(--card) 30%, transparent) 0%,
    color-mix(in srgb, var(--card) 14%, transparent) 48%,
    transparent 82%);
  -webkit-mask-image: radial-gradient(circle closest-side, #000 74%, transparent 100%);
  mask-image: radial-gradient(circle closest-side, #000 74%, transparent 100%);
  transition: opacity 0.22s ease, transform 0.24s cubic-bezier(0.22, 1, 0.36, 1);
}
.pie-scrim.show {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}
.pie-line {
  position: absolute;
  left: 0;
  top: 0;
  overflow: visible;
  pointer-events: none;
  z-index: 1; /* 在模糊层之上、入口按钮与扇形项之下，仅作视觉引导 */
}
.pie-center {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: var(--primary);
  color: #fff;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  z-index: 2;
}
.pie-item {
  position: absolute;
  left: 0;
  top: 0;
  width: 56px;
  height: 56px;
  z-index: 2;
  border-radius: 50%;
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.18s, border-color 0.12s;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  will-change: transform;
}
.pie-item.hover {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary) 35%, transparent), 0 6px 16px rgba(0, 0, 0, 0.22);
}
.pi-lab {
  font-size: 10px;
  margin-top: 1px;
  color: var(--text-2);
  transform: scale(0.92);
  line-height: 1;
}
</style>
