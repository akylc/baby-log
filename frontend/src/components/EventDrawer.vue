<template>
  <n-drawer :show="show" @update:show="emit('update:show', $event)" :width="drawerWidth" placement="right">
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
        <n-form-item label="标签（可选）">
          <n-select
            v-model:value="selectedTags"
            multiple
            :options="tagOptions"
            placeholder="为该事件归类，可不选"
            clearable
          />
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
import { ref, watch, computed } from 'vue'
import {
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NDatePicker,
  NSelect,
  NButton,
  NSpace,
  useMessage,
} from 'naive-ui'
import { eventsApi } from '@/api/events'
import { topicsApi } from '@/api/topics'
import { useDrawerWidth } from '@/composables/useResponsive'
import type { EventItem, TopicTag } from '@/types'
import { tsToIso, isoToTs } from '@/utils/time'

const props = defineProps<{ show: boolean; topicId?: number; event: EventItem | null }>()
const emit = defineEmits<{
  (e: 'update:show', v: boolean): void
  (e: 'saved'): void
}>()

const { drawerWidth } = useDrawerWidth(420)
const message = useMessage()
const loading = ref(false)
const form = ref({ title: '', occurredAt: Date.now(), note: '' })
const selectedTags = ref<number[]>([])
const topicTags = ref<TopicTag[]>([])

const tagOptions = computed(() => topicTags.value.map((t) => ({ label: t.name, value: t.id })))

watch(
  () => props.show,
  async (v) => {
    if (!v) return
    const tid = props.topicId ?? props.event?.topic_id
    if (tid) topicTags.value = await topicsApi.tags(tid)
    if (props.event) {
      form.value = {
        title: props.event.title,
        occurredAt: isoToTs(props.event.occurred_at),
        note: props.event.note || '',
      }
      selectedTags.value = (props.event.tags || []).map((t) => t.id)
    } else {
      form.value = { title: '', occurredAt: Date.now(), note: '' }
      selectedTags.value = []
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
      await eventsApi.update({
        id: props.event.id,
        title: form.value.title,
        occurred_at,
        note: form.value.note,
        tags: selectedTags.value,
      })
    } else {
      await eventsApi.create({
        topicId: props.topicId,
        title: form.value.title,
        occurred_at,
        note: form.value.note,
        tags: selectedTags.value,
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
