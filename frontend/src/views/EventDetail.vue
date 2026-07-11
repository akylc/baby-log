<template>
  <div class="page">
    <header class="topbar">
      <n-button text @click="goBack">← 返回</n-button>
      <div class="brand">{{ detail?.title || '事件详情' }}</div>
      <n-button text @click="goTypes">类型</n-button>
    </header>

    <section class="content" v-if="detail">
      <n-card>
        <div class="event-time">{{ formatTime(detail.occurred_at) }}</div>
        <div class="event-title">{{ detail.title }}</div>
        <div v-if="detail.note" class="event-note">{{ detail.note }}</div>
        <template #footer>
          <n-space justify="end">
            <n-button size="small" @click="openEditEvent">编辑事件</n-button>
            <n-button size="small" type="error" @click="removeEvent">删除事件</n-button>
          </n-space>
        </template>
      </n-card>

      <div class="content-head" style="margin-top: 20px">
        <h2>记录（{{ detail.records.length }}）</h2>
        <n-button type="primary" @click="openAddRecord">+ 添加记录</n-button>
      </div>

      <n-empty v-if="detail.records.length === 0" description="还没有记录" />
      <div v-else class="record-list">
        <n-card v-for="r in detail.records" :key="r.id">
          <div class="record-item">
            <div class="record-icon">{{ typeIcon(r.type_id) }}</div>
            <div class="record-body">
              <div class="record-type">{{ typeLabel(r.type_id) }}</div>
              <div class="record-content" v-html="renderPayload(r)"></div>
              <n-space v-if="r.tags && r.tags.length" style="margin-top: 6px">
                <n-tag v-for="t in r.tags" :key="t.id" :color="tagColor(t)" size="small">
                  {{ t.name }}
                </n-tag>
              </n-space>
            </div>
            <div class="record-actions">
              <n-space vertical>
                <n-button size="small" text @click="openEditRecord(r)">编辑</n-button>
                <n-button size="small" text type="error" @click="removeRecord(r)">删除</n-button>
              </n-space>
            </div>
          </div>
        </n-card>
      </div>
    </section>

    <EventDrawer
      v-model:show="eventDrawerShow"
      :topic-id="detail?.topic_id"
      :event="detail"
      @saved="reload"
    />
    <RecordDrawer
      v-model:show="recordDrawerShow"
      :topic-id="detail?.topic_id"
      :event-id="detail?.id"
      :record="editingRecord"
      @saved="reload"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton,
  NCard,
  NSpace,
  NEmpty,
  NTag,
  useMessage,
  useDialog,
} from 'naive-ui'
import { eventsApi } from '@/api/events'
import { recordsApi } from '@/api/records'
import { useTypesStore } from '@/stores/types'
import { topicsApi } from '@/api/topics'
import type { EventDetail as EventDetailT, RecordItem, TopicTag } from '@/types'
import { formatTime } from '@/utils/time'
import EventDrawer from '@/components/EventDrawer.vue'
import RecordDrawer from '@/components/RecordDrawer.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const store = useTypesStore()

const detail = ref<EventDetailT | null>(null)
const topicTags = ref<TopicTag[]>([])
const eventDrawerShow = ref(false)
const recordDrawerShow = ref(false)
const editingRecord = ref<RecordItem | null>(null)

const eventId = Number(route.params.id)

async function reload() {
  detail.value = await eventsApi.detail(eventId)
}
onMounted(async () => {
  await store.load()
  await reload()
  if (detail.value) topicTags.value = await topicsApi.tags(detail.value.topic_id)
})

function typeIcon(id: number): string {
  return store.getType(id)?.icon || '📝'
}
function typeLabel(id: number): string {
  return store.getType(id)?.label || '记录'
}
function tagColor(t: TopicTag) {
  return t.color ? { color: t.color, textColor: '#fff' } : undefined
}
function renderPayload(r: RecordItem): string {
  const type = store.getType(r.type_id)
  let obj: any = {}
  try {
    obj = JSON.parse(r.payload)
  } catch {
    return r.payload
  }
  if (type?.key === 'image' && obj.url) {
    return `<a href="${obj.url}" target="_blank">${obj.url}</a><br/><img src="${obj.url}" alt="" />`
  }
  return Object.entries(obj)
    .map(([k, v]) => `<div>${escapeHtml(String(v))}</div>`)
    .join('')
}
function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c))
}

function openEditEvent() {
  eventDrawerShow.value = true
}
function openAddRecord() {
  editingRecord.value = null
  recordDrawerShow.value = true
}
function openEditRecord(r: RecordItem) {
  editingRecord.value = r
  recordDrawerShow.value = true
}
async function removeEvent() {
  dialog.warning({
    title: '删除事件',
    content: '确定删除该事件？其下记录将一并删除。',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await eventsApi.remove(eventId)
      message.success('已删除')
      router.push(`/topics/${detail.value?.topic_id}`)
    },
  })
}
async function removeRecord(r: RecordItem) {
  dialog.warning({
    title: '删除记录',
    content: '确定删除该记录？',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await recordsApi.remove(r.id)
      message.success('已删除')
      reload()
    },
  })
}
function goBack() {
  router.push(`/topics/${detail.value?.topic_id}`)
}
function goTypes() {
  router.push('/types')
}
</script>
