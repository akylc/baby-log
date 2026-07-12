import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getBabies, addBaby, updateBaby, deleteBaby, type Baby } from '@/api/baby'

const CURRENT_KEY = 'ml_current_baby'

export const useBabyStore = defineStore('baby', () => {
  const babies = ref<Baby[]>([])
  const currentId = ref<number | null>(Number(localStorage.getItem(CURRENT_KEY)) || null)

  const currentBaby = computed<Baby | null>(() => {
    if (currentId.value != null) {
      const f = babies.value.find((b) => b.id === currentId.value)
      if (f) return f
    }
    return babies.value[0] || null
  })

  function persist() {
    if (currentId.value != null) localStorage.setItem(CURRENT_KEY, String(currentId.value))
    else localStorage.removeItem(CURRENT_KEY)
  }

  async function fetch() {
    babies.value = await getBabies()
    // 校正当前选中：若失效则回落到第一个宝宝
    if (!babies.value.find((b) => b.id === currentId.value)) {
      currentId.value = babies.value[0]?.id ?? null
    }
    persist()
    return currentBaby.value
  }

  function selectBaby(id: number) {
    currentId.value = id
    persist()
  }

  async function add(payload: { name: string; birthday?: string | null; gender?: string }) {
    const b = await addBaby(payload)
    babies.value.push(b)
    currentId.value = b.id // 新增后自动选中
    persist()
    return b
  }

  async function update(id: number, payload: { name?: string; birthday?: string | null; gender?: string }) {
    const b = await updateBaby(id, payload)
    const i = babies.value.findIndex((x) => x.id === id)
    if (i >= 0) babies.value[i] = b
    return b
  }

  async function remove(id: number) {
    await deleteBaby(id)
    babies.value = babies.value.filter((b) => b.id !== id)
    if (currentId.value === id) {
      currentId.value = babies.value[0]?.id ?? null
    }
    persist()
  }

  return { babies, currentId, currentBaby, fetch, selectBaby, add, update, remove }
})
