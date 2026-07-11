<template>
  <n-drawer :show="show" @update:show="emit('update:show', $event)" :width="420" placement="right">
    <n-drawer-content :title="topic ? '编辑主题' : '新建主题'">
      <n-form label-placement="top">
        <n-form-item label="名称">
          <n-input v-model:value="form.name" placeholder="如：宝宝 / 家庭 / 旅行" />
        </n-form-item>
        <n-form-item label="图标（emoji）">
          <n-input v-model:value="form.icon" placeholder="📁" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="form.note" type="textarea" placeholder="可选" />
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
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NSpace,
  useMessage,
} from 'naive-ui'
import { topicsApi } from '@/api/topics'
import type { Topic } from '@/types'

const props = defineProps<{ show: boolean; topic: Topic | null }>()
const emit = defineEmits<{
  (e: 'update:show', v: boolean): void
  (e: 'saved'): void
}>()

const message = useMessage()
const loading = ref(false)
const form = ref({ name: '', icon: '', note: '' })

watch(
  () => props.show,
  (v) => {
    if (v) {
      form.value = props.topic
        ? { name: props.topic.name, icon: props.topic.icon || '', note: props.topic.note || '' }
        : { name: '', icon: '', note: '' }
    }
  },
)

async function save() {
  if (!form.value.name) {
    message.warning('请填写名称')
    return
  }
  loading.value = true
  try {
    if (props.topic) {
      await topicsApi.update({ id: props.topic.id, ...form.value })
    } else {
      await topicsApi.create(form.value)
    }
    message.success('已保存')
    emit('saved')
    emit('update:show', false)
  } catch (e: any) {
    message.error(e.message || '保存失败')
  } finally {
    loading.value = false
  }
}
</script>
