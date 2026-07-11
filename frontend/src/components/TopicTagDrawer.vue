<template>
  <n-drawer v-model:show="show" :width="440" placement="right">
    <n-drawer-content :title="`标签管理 · ${topic?.name || ''}`">
      <n-empty v-if="tags.length === 0" description="还没有标签，添加一个吧" />
      <n-list v-else bordered>
        <n-list-item v-for="t in tags" :key="t.id">
          <div class="topic-card-body">
            <span
              class="swatch"
              :style="{ background: t.color || '#ccc' }"
            ></span>
            <div class="topic-meta" style="flex: 1">
              <div class="topic-name">{{ t.name }}</div>
            </div>
            <n-space>
              <n-button size="small" text @click="editTag(t)">编辑</n-button>
              <n-button size="small" text type="error" @click="removeTag(t)">删除</n-button>
            </n-space>
          </div>
        </n-list-item>
      </n-list>

      <n-divider />

      <n-form label-placement="top">
        <n-form-item label="标签名">
          <n-input v-model:value="form.name" placeholder="如：疫苗 / 发烧" />
        </n-form-item>
        <n-form-item label="颜色（可选）">
          <n-color-picker v-model:value="form.color" :show-alpha="false" clearable />
        </n-form-item>
      </n-form>
      <n-space justify="end">
        <n-button @click="resetForm">重置</n-button>
        <n-button type="primary" :loading="loading" @click="saveTag">保存标签</n-button>
      </n-space>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  NDrawer,
  NDrawerContent,
  NList,
  NListItem,
  NEmpty,
  NButton,
  NSpace,
  NForm,
  NFormItem,
  NInput,
  NColorPicker,
  NDivider,
  useMessage,
} from 'naive-ui'
import { topicsApi } from '@/api/topics'
import type { Topic, TopicTag } from '@/types'

const props = defineProps<{ show: boolean; topic: Topic | null }>()
const emit = defineEmits<{
  (e: 'update:show', v: boolean): void
  (e: 'saved'): void
}>()

const message = useMessage()
const tags = ref<TopicTag[]>([])
const loading = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ name: '', color: '#4f8cff' })

async function load() {
  if (!props.topic) return
  tags.value = await topicsApi.tags(props.topic.id)
}
watch(
  () => props.show,
  (v) => {
    if (v) {
      resetForm()
      load()
    }
  },
)

function resetForm() {
  editingId.value = null
  form.value = { name: '', color: '#4f8cff' }
}
function editTag(t: TopicTag) {
  editingId.value = t.id
  form.value = { name: t.name, color: t.color || '#4f8cff' }
}
async function saveTag() {
  if (!form.value.name) {
    message.warning('请填写标签名')
    return
  }
  if (!props.topic) return
  loading.value = true
  try {
    if (editingId.value) {
      await topicsApi.updateTag({ tagId: editingId.value, name: form.value.name, color: form.value.color })
    } else {
      await topicsApi.createTag({
        topicId: props.topic.id,
        name: form.value.name,
        color: form.value.color,
      })
    }
    message.success('已保存')
    resetForm()
    await load()
    emit('saved')
  } catch (e: any) {
    message.error(e.message || '保存失败')
  } finally {
    loading.value = false
  }
}
async function removeTag(t: TopicTag) {
  await topicsApi.removeTag(t.id)
  message.success('已删除')
  load()
  emit('saved')
}
</script>

<style scoped>
.swatch {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  display: inline-block;
  margin-right: 10px;
  flex: none;
}
</style>
