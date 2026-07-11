<template>
  <div class="page">
    <header class="topbar">
      <n-button text @click="goHome">← 返回</n-button>
      <div class="brand">{{ topic?.name || '事件' }}</div>
      <n-button text @click="goTypes">类型</n-button>
    </header>

    <section class="content">
      <div class="content-head">
        <n-input v-model:value="q" placeholder="搜索标题/备注" clearable style="max-width: 280px" />
        <n-button type="primary" @click="openCreate">+ 新建事件</n-button>
      </div>

      <div class="tag-filter">
        <span class="label">标签：</span>
        <n-checkbox-group v-model:value="selectedTags">
          <n-space>
            <n-checkbox v-for="tag in tags" :key="tag.id" :value="tag.id">{{ tag.name }}</n-checkbox>
          </n-space>
        </n-checkbox-group>
        <template v-if="selectedTags.length">
          <n-radio-group :value="match" size="small" @update:value="onMatchChange">
            <n-radio-button value="any">任一</n-radio-button>
            <n-radio-button value="all">全部</n-radio-button>
          </n-radio-group>
          <n-button text size="small" @click="clearTags">清除</n-button>
        </template>
      </div>

      <n-empty v-if="events.length === 0" :description="selectedTags.length ? '没有匹配的事件' : '还没有事件'" />
      <div v-else class="timeline">
        <n-card
          v-for="e in events"
          :key="e.id"
          class="event-card"
          hoverable
          @click="openEvent(e)"
        >
          <div class="event-time">{{ formatTime(e.occurred_at) }}</div>
          <div class="event-title">{{ e.title }}</div>
          <div v-if="e.note" class="event-note">{{ e.note }}</div>
        </n-card>
      </div>
    </section>

    <EventDrawer v-model:show="eventDrawerShow" :topic-id="topicId" :event="editingEvent" @saved="loadEvents" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton,
  NInput,
  NSpace,
  NCheckbox,
  NCheckboxGroup,
  NRadioGroup,
  NRadioButton,
  NCard,
  NEmpty,
} from 'naive-ui'
import { topicsApi } from '@/api/topics'
import { eventsApi } from '@/api/events'
import type { Topic, TopicTag, EventItem } from '@/types'
import { formatTime } from '@/utils/time'
import EventDrawer from '@/components/EventDrawer.vue'

const route = useRoute()
const router = useRouter()

const topicId = Number(route.params.id)
const topic = ref<Topic | null>(null)
const tags = ref<TopicTag[]>([])
const events = ref<EventItem[]>([])
const q = ref('')
const selectedTags = ref<number[]>([])
const match = ref<'any' | 'all'>('any')
const eventDrawerShow = ref(false)
const editingEvent = ref<EventItem | null>(null)
let searchTimer: any = null

async function loadTopic() {
  topic.value = await topicsApi.detail(topicId)
  tags.value = await topicsApi.tags(topicId)
}
async function loadEvents() {
  events.value = await eventsApi.list({
    topicId,
    q: q.value || undefined,
    tags: selectedTags.value,
    match: match.value,
  })
}
onMounted(async () => {
  await loadTopic()
  await loadEvents()
})

watch(q, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(loadEvents, 300)
})
watch(selectedTags, loadEvents)

function onMatchChange(v: 'any' | 'all') {
  match.value = v
  loadEvents()
}
function clearTags() {
  selectedTags.value = []
}

function openCreate() {
  editingEvent.value = null
  eventDrawerShow.value = true
}
function openEvent(e: EventItem) {
  router.push(`/events/${e.id}`)
}
function goHome() {
  router.push('/')
}
function goTypes() {
  router.push('/types')
}
</script>
