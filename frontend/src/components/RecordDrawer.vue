<template>
  <n-drawer :show="show" @update:show="emit('update:show', $event)" :width="440" placement="right">
    <n-drawer-content :title="record ? '编辑记录' : '添加记录'">
      <n-form label-placement="top">
        <n-form-item label="类型" required>
          <n-select v-model:value="typeId" :options="typeOptions" placeholder="选择类型" />
        </n-form-item>

        <n-form-item v-for="f in schemaFields" :key="f.name" :label="f.label">
          <n-input v-model:value="fields[f.name]" :placeholder="f.label" />
        </n-form-item>

        <n-form-item v-if="isImage" label="图片">
          <div style="width: 100%">
            <n-upload :custom-request="onUpload" :show-file-list="false" accept="image/*">
              <n-button>上传图片</n-button>
            </n-upload>
            <n-input
              v-if="fields.url"
              v-model:value="fields.url"
              placeholder="图片URL"
              style="margin-top: 8px"
            />
          </div>
        </n-form-item>

        <n-form-item label="标签（非必选）">
          <n-select
            v-model:value="selectedTags"
            multiple
            :options="tagOptions"
            placeholder="可不选"
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
  NSelect,
  NButton,
  NSpace,
  NUpload,
  useMessage,
} from 'naive-ui'
import { useTypesStore } from '@/stores/types'
import { recordsApi } from '@/api/records'
import { topicsApi } from '@/api/topics'
import { uploadImage } from '@/api/upload'
import type { RecordItem, TopicTag, RecordType } from '@/types'

const props = defineProps<{
  show: boolean
  topicId?: number
  eventId?: number
  record: RecordItem | null
}>()
const emit = defineEmits<{
  (e: 'update:show', v: boolean): void
  (e: 'saved'): void
}>()

const message = useMessage()
const store = useTypesStore()
const loading = ref(false)
const typeId = ref<number | null>(null)
const fields = ref<Record<string, any>>({})
const selectedTags = ref<number[]>([])
const topicTags = ref<TopicTag[]>([])

const currentType = computed<RecordType | undefined>(() =>
  store.types.find((t) => t.id === typeId.value),
)
const schemaFields = computed(() => {
  try {
    return JSON.parse(currentType.value?.schema || '{}').fields || []
  } catch {
    return []
  }
})
const isImage = computed(() => currentType.value?.key === 'image')
const typeOptions = computed(() =>
  store.types.map((t) => ({ label: t.label, value: t.id })),
)
const tagOptions = computed(() =>
  topicTags.value.map((t) => ({ label: t.name, value: t.id })),
)

watch(typeId, () => {
  const init: Record<string, any> = {}
  for (const f of schemaFields.value) init[f.name] = ''
  fields.value = init
})

watch(
  () => props.show,
  async (v) => {
    if (!v) return
    await store.load()
    if (props.topicId) topicTags.value = await topicsApi.tags(props.topicId)
    if (props.record) {
      typeId.value = props.record.type_id
      selectedTags.value = (props.record.tags || []).map((t) => t.id)
      try {
        fields.value = JSON.parse(props.record.payload)
      } catch {
        fields.value = {}
      }
    } else {
      typeId.value = store.types[0]?.id ?? null
      selectedTags.value = []
      fields.value = {}
    }
  },
)

function onUpload(options: any) {
  const file = options.file.file
  uploadImage(file)
    .then((url) => {
      fields.value['url'] = url
      options.onFinish()
      message.success('上传成功')
    })
    .catch((e) => {
      options.onError()
      message.error(e.message || '上传失败')
    })
}

async function save() {
  if (!typeId.value) {
    message.warning('请选择类型')
    return
  }
  if (isImage.value && !fields.value['url']) {
    message.warning('请上传图片')
    return
  }
  loading.value = true
  try {
    const payload = JSON.stringify(fields.value)
    if (props.record) {
      await recordsApi.update({ id: props.record.id, payload, tags: selectedTags.value })
    } else {
      await recordsApi.create({
        eventId: props.eventId,
        typeId: typeId.value,
        payload,
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
