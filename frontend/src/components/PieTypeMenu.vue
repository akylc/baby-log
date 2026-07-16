<template>
  <!-- 试验性功能：按住右下角圆形按钮 → 扇形径向展开全部类型 → 滑动到目标松开即切换 -->
  <div class="pie" ref="wrapRef">
    <button class="pie-center" type="button" :aria-label="`扇形切换（试验）：${currentLabel}`" @pointerdown.prevent="start">
      <span class="pc-ico">{{ currentIcon }}</span>
      <span class="pie-beta">试</span>
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
import { computed, ref } from 'vue'

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

function onMove(e: PointerEvent) {
  if (!open.value || !wrapRef.value) return
  const r = wrapRef.value.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  const px = e.clientX - cx
  const py = e.clientY - cy
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
function onUp() {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  window.removeEventListener('pointercancel', onUp)
  if (open.value && hoverIdx.value >= 0) emit('select', props.items[hoverIdx.value].value)
  open.value = false
  hoverIdx.value = -1
}
function start(e: PointerEvent) {
  e.preventDefault()
  open.value = true
  hoverIdx.value = -1
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
}
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
}
@media (max-width: 480px) {
  .pie {
    right: 48px;
  }
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
}
.pie-beta {
  position: absolute;
  right: -3px;
  top: -3px;
  font-size: 10px;
  line-height: 1;
  background: var(--accent, #ff9f43);
  color: #fff;
  border-radius: 8px;
  padding: 1px 4px;
}
.pie-item {
  position: absolute;
  left: 0;
  top: 0;
  width: 56px;
  height: 56px;
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
