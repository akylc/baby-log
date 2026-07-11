<template>
  <div class="page">
    <header class="topbar">
      <n-button text @click="goHome">← 返回</n-button>
      <div class="brand">类型管理</div>
      <n-button text @click="openCreate">+ 新增</n-button>
    </header>

    <section class="content">
      <n-empty v-if="types.length === 0" description="加载中…" />
      <n-list v-else bordered>
        <n-list-item v-for="t in types" :key="t.id">
          <div class="topic-card-body">
            <div class="topic-icon">{{ t.icon || '🏷️' }}</div>
            <div class="topic-meta">
              <div class="topic-name">{{ t.label }} <span class="topic-sub">（{{ t.key }}）</span></div>
              <div class="topic-sub">{{ schemaFields(t.schema) }}</div>
            </div>
          </div>
        </n-list-item>
      </n-list>
    </section>

    <n-drawer v-model:show="show" :width="420" placement="right">
      <n-drawer-content title="新增类型">
        <n-form label-placement="top">
          <n-form-item label="类型 key（唯一英文标识）">
            <n-input v-model:value="form.key" placeholder="如：height" />
          </n-form-item>
          <n-form-item label="显示名">
            <n-input v-model:value="form.label" placeholder="如：身高" />
          </n-form-item>
          <n-form-item label="图标（emoji）">
            <n-input v-model:value="form.icon" placeholder="📏" />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-space justify="end">
            <n-button @click="show = false">取消</n-button>
            <n-button type="primary" :loading="loading" @click="save">保存</n-button>
          </n-space>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton,
  NList,
  NListItem,
  NEmpty,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NSpace,
  useMessage,
} from 'naive-ui'
import { useTypesStore } from '@/stores/types'
import { typesApi } from '@/api/types'
import type { RecordType } from '@/types'

const router = useRouter()
const message = useMessage()
const store = useTypesStore()
const types = ref<RecordType[]>([])
const show = ref(false)
const loading = ref(false)
const form = ref({ key: '', label: '', icon: '' })

async function load() {
  types.value = await store.load()
}
onMounted(load)

function goHome() {
  router.push('/')
}
function openCreate() {
  form.value = { key: '', label: '', icon: '' }
  show.value = true
}
function schemaFields(schema: string): string {
  try {
    const s = JSON.parse(schema)
    return (s.fields || []).map((f: any) => f.label).join('、') || '无字段'
  } catch {
    return ''
  }
}
async function save() {
  if (!form.value.key || !form.value.label) {
    message.warning('请填写 key 与显示名')
    return
  }
  loading.value = true
  try {
    await typesApi.create(form.value)
    message.success('已新增')
    store.types.length = 0 // 触发下次重新加载
    show.value = false
    load()
  } catch (e: any) {
    message.error(e.message || '保存失败')
  } finally {
    loading.value = false
  }
}
</script>
