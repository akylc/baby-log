<template>
  <div class="page">
    <header class="topbar">
      <div class="brand">📖 时光簿</div>
      <n-button text @click="goTypes">类型管理</n-button>
    </header>

    <section class="content">
      <div class="content-head">
        <h2>我的主题</h2>
        <n-button type="primary" @click="openCreate">+ 新建主题</n-button>
      </div>

      <n-empty v-if="topics.length === 0" description="还没有主题，先建一个吧" />
      <div v-else class="grid">
        <n-card
          v-for="t in topics"
          :key="t.id"
          class="topic-card"
          hoverable
          @click="openTopic(t)"
        >
          <div class="topic-card-body">
            <div class="topic-icon">{{ t.icon || '📁' }}</div>
            <div class="topic-meta">
              <div class="topic-name">{{ t.name }}</div>
              <div class="topic-sub">{{ t.event_count || 0 }} 个事件</div>
            </div>
          </div>
          <template #footer>
            <n-space justify="end">
              <n-button size="small" text @click.stop="openTags(t)">标签</n-button>
              <n-button size="small" text @click.stop="openEdit(t)">编辑</n-button>
              <n-button size="small" text type="error" @click.stop="remove(t)">删除</n-button>
            </n-space>
          </template>
        </n-card>
      </div>
    </section>

    <TopicDrawer v-model:show="drawerShow" :topic="editing" @saved="onSaved" />
    <TopicTagDrawer v-model:show="tagDrawerShow" :topic="tagTopic" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NCard, NSpace, NEmpty, useMessage, useDialog } from 'naive-ui'
import { topicsApi } from '@/api/topics'
import type { Topic } from '@/types'
import TopicDrawer from '@/components/TopicDrawer.vue'
import TopicTagDrawer from '@/components/TopicTagDrawer.vue'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()

const topics = ref<Topic[]>([])
const drawerShow = ref(false)
const editing = ref<Topic | null>(null)
const tagDrawerShow = ref(false)
const tagTopic = ref<Topic | null>(null)

async function load() {
  topics.value = await topicsApi.list()
}
onMounted(load)

function openCreate() {
  editing.value = null
  drawerShow.value = true
}
function openEdit(t: Topic) {
  editing.value = t
  drawerShow.value = true
}
function openTags(t: Topic) {
  tagTopic.value = t
  tagDrawerShow.value = true
}
function openTopic(t: Topic) {
  router.push(`/topics/${t.id}`)
}
function goTypes() {
  router.push('/types')
}

async function remove(t: Topic) {
  dialog.warning({
    title: '删除主题',
    content: `确定删除「${t.name}」？其下事件与记录将一并删除。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await topicsApi.remove(t.id)
      message.success('已删除')
      load()
    },
  })
}

function onSaved() {
  drawerShow.value = false
  tagDrawerShow.value = false
  load()
}
</script>
