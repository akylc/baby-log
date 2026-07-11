import { defineStore } from 'pinia'
import { ref } from 'vue'
import { typesApi } from '@/api/types'
import type { RecordType } from '@/types'

export const useTypesStore = defineStore('types', () => {
  const types = ref<RecordType[]>([])

  async function load() {
    if (types.value.length) return types.value
    types.value = await typesApi.list()
    return types.value
  }

  function getType(id: number): RecordType | undefined {
    return types.value.find((t) => t.id === id)
  }

  return { types, load, getType }
})
