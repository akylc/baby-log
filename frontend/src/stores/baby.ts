import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getBaby, saveBaby, type Baby } from '@/api/baby'

export const useBabyStore = defineStore('baby', () => {
  const baby = ref<Baby | null>(null)

  async function fetch() {
    baby.value = await getBaby()
    return baby.value
  }

  async function save(payload: { name: string; birthday?: string | null; gender?: string }) {
    baby.value = await saveBaby(payload)
    return baby.value
  }

  return { baby, fetch, save }
})
