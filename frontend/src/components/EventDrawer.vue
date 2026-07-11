<template>
  <n-drawer :show="show" @update:show="emit('update:show', $event)" :width="420" placement="right">
    <n-drawer-content :title="event ? '编辑事件' : '新建事件'">
      <n-form label-placement="top">
        <n-form-item label="标题" required>
          <n-input v-model:value="form.title" placeholder="发生了什么" />
        </n-form-item>
        <n-form-item label="发生时间" required>
          <n-date-picker v-model:value="form.occurredAt" type="datetime" style="width: 100%" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="form.note" type="textarea" placeholder="可选" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="emit('update:show', false)">取消</n-button>
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
  NDatePicker,
  NButton,
  NSpace,
  useMessage,
} from 'naive-ui'
import { eventsApi } from '@/api/events'
import type { EventItem } from '@/types'
import { tsToIso, isoToTs } from '@/utils/time'

const props = defineProps<{ show: boolean; topicId?: number; event: EventItem | null }>()
const emit = defineEmits<{
  (e: 'update:show', v: boolean): void
  (e: 'saved'): void
}>()

const message = useMessage()
const loading = ref(false)
const form = ref({ title: '', occurredAt: Date.now(), note: '' })

watch(
  () => props.show,
  (v) => {
    if (v) {
      form.value = props.event
        ? {
            title: props.event.title,
            occurredAt: isoToTs(props.event.occurred_at),
            note: props.event.note || '',
          }
        : { title: '', occurredAt: Date.now(), note: '' }
    }
  },
)

async function save() {
  if (!form.value.title) {
    message.warning('请填写标题')
    return
  }
  loading.value = true
  try {
    const occurred_at = tsToIso(form.value.occurredAt)
    if (props.event) {
      await eventsApi.update({ id: props.event.id, title: form.value.title, occurred_at, note: form.value.note })
    } else {
      await eventsApi.create({
        topicId: props.topicId,
        title: form.value.title,
        occurred_at,
        note: form.value.note,
      })
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
