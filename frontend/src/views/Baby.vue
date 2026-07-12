<template>
  <div class="baby">
    <header class="hd">
      <button class="back" type="button" aria-label="返回" @click="goHome">‹</button>
      <span class="title">我的</span>
      <span style="width: 40px"></span>
    </header>

    <div class="card">
      <div class="sec-label">当前宝宝</div>
      <div class="cur-head">
        <div class="avatar sm">👶</div>
        <div class="meta">
          <div class="nm">
            {{ currentBaby?.name || '未创建' }}
            <span v-if="selectedId == null && babies.length > 0" class="cur">新宝宝</span>
          </div>
          <div class="gd">{{ currentBaby ? genderLabel(currentBaby.gender) : '—' }}</div>
        </div>
        <button
          v-if="currentBaby && selectedId != null"
          class="icon-btn"
          type="button"
          aria-label="删除宝宝"
          @click="removeBaby(selectedId)"
        >🗑</button>
      </div>
      <div v-if="babies.length === 0" class="empty-tip">还没有宝宝，先在下方创建一个吧</div>

      <!-- 编辑 / 新增表单 -->
      <div class="edit-box">
        <div class="field">
          <label>宝宝名字</label>
          <n-input v-model:value="name" placeholder="如 小葡萄" />
        </div>
        <div class="field">
          <label>生日</label>
          <n-date-picker
            v-model:value="birthdayTs"
            type="date"
            format="yyyy-MM-dd"
            clearable
            :is-date-disabled="disableFutureDate"
            input-readonly
          />
        </div>
        <div class="field">
          <label>性别</label>
          <div class="seg">
            <button
              v-for="o in genderOpts"
              :key="o.value"
              :class="['seg-btn', { active: gender === o.value }]"
              type="button"
              @click="gender = o.value"
            >
              {{ o.label }}
            </button>
          </div>
        </div>
        <n-button type="primary" block size="large" :loading="loading" @click="save">
          {{ selectedId != null ? '保存修改' : '创建宝宝' }}
        </n-button>
        <n-button v-if="selectedId != null" block @click="startAdd">＋ 再添加一个宝宝</n-button>
      </div>
    </div>

    <div class="card setting">
      <div class="setting-row">
        <span class="s-label">深色模式</span>
        <div class="seg theme-seg">
          <button
            v-for="o in themeOpts"
            :key="o.value"
            :class="['seg-btn', { active: mode === o.value }]"
            type="button"
            @click="setThemeMode(o.value)"
          >
            {{ o.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="account">
      <div class="acc-name">账号：{{ auth.user?.username || '—' }}</div>
      <n-button block @click="logout">退出登录</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRevealRefresh } from '@/utils/reveal'
import { useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { useBabyStore } from '@/stores/baby'
import { useAuthStore } from '@/stores/auth'
import { mode, setThemeMode } from '@/utils/theme'
import { disableFutureDate, isBirthdayInFuture } from '@/utils/date'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const babyStore = useBabyStore()
const { babies, currentBaby } = storeToRefs(babyStore)
const auth = useAuthStore()

function goHome() {
  router.replace('/')
}

const themeOpts = [
  { value: 'system', label: '跟随系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
]

const genderOpts = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'unknown', label: '未知' },
]
function genderLabel(g: string): string {
  return ({ male: '男', female: '女', unknown: '未知' } as Record<string, string>)[g] || '未知'
}

const selectedId = ref<number | null>(null)
const name = ref('')
const birthdayTs = ref<number | null>(null)
const gender = ref<'male' | 'female' | 'unknown'>('unknown')
const loading = ref(false)

function fmtDate(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function loadForm(b: { id: number; name: string; birthday: string | null; gender: string }) {
  selectedId.value = b.id
  name.value = b.name
  birthdayTs.value = b.birthday ? new Date(b.birthday).getTime() : null
  gender.value = b.gender as 'male' | 'female' | 'unknown'
}
function startAdd() {
  selectedId.value = null
  name.value = ''
  birthdayTs.value = null
  gender.value = 'unknown'
}

async function load() {
  if (!auth.user) await auth.fetchMe()
  await babyStore.fetch()
  if (currentBaby.value) loadForm(currentBaby.value)
}
onMounted(load)
// 从后台切回前台时刷新当前页面
useRevealRefresh(load)

async function save() {
  if (!name.value.trim()) {
    message.warning('请填写宝宝名字')
    return
  }
  if (isBirthdayInFuture(birthdayTs.value)) {
    message.warning('生日不能晚于今天')
    return
  }
  loading.value = true
  try {
    const payload = {
      name: name.value.trim(),
      birthday: birthdayTs.value ? fmtDate(birthdayTs.value) : null,
      gender: gender.value,
    }
    if (selectedId.value != null) {
      await babyStore.update(selectedId.value, payload)
      message.success('已保存')
    } else {
      const b = await babyStore.add(payload)
      selectedId.value = b.id
      message.success('已创建')
    }
  } catch (e: any) {
    message.error(e?.message || '保存失败')
  } finally {
    loading.value = false
  }
}

function removeBaby(id: number) {
  const b = babies.value.find((x) => x.id === id)
  dialog.warning({
    title: '删除宝宝',
    content: `确定删除「${b?.name || '该宝宝'}」吗？其所有记录也会一并删除，且无法恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    type: 'error',
    onPositiveClick: async () => {
      try {
        await babyStore.remove(id)
        message.success('已删除')
        if (currentBaby.value) loadForm(currentBaby.value)
        else startAdd()
      } catch (e: any) {
        message.error(e?.message || '删除失败')
      }
    },
  })
}

function logout() {
  auth.logout()
  router.replace('/login')
}
</script>

<style scoped>
.baby {
  padding: 12px 16px 24px;
}
.hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.title {
  font-size: 16px;
  font-weight: 600;
}
.back {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: var(--text-1);
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: -8px;
}
.card {
  background: var(--card);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}
.sec-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-1);
}
.empty-tip {
  font-size: 13px;
  color: var(--text-3);
  padding: 6px 0;
}
.cur-head {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
}
.avatar.sm {
  width: 38px;
  height: 38px;
  font-size: 20px;
  border-radius: 50%;
  background: var(--avatar-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.meta {
  flex: 1;
  min-width: 0;
}
.nm {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}
.cur {
  font-size: 11px;
  color: var(--primary-deep);
  background: #fff;
  border-radius: 8px;
  padding: 1px 8px;
  margin-left: 4px;
}
.gd {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 2px;
}
.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: none;
  background: rgba(255, 77, 79, 0.12);
  font-size: 16px;
  cursor: pointer;
  flex: none;
  transition: background 0.15s ease;
}
.icon-btn:hover {
  background: rgba(255, 77, 79, 0.24);
}
.icon-btn:active {
  background: rgba(255, 77, 79, 0.34);
}
.edit-box {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 4px;
  padding-top: 14px;
  border-top: 1px solid var(--border-soft);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field label {
  font-size: 13px;
  color: var(--text-2);
}
.seg {
  display: flex;
  gap: 8px;
}
.seg-btn {
  flex: 1;
  border: 1px solid var(--border);
  background: var(--card);
  border-radius: 10px;
  padding: 10px;
  font-size: 13px;
  color: var(--text-1);
  cursor: pointer;
}
.seg-btn.active {
  background: var(--card-pink);
  border-color: var(--primary);
  color: var(--primary-deep);
  font-weight: 600;
}
.theme-seg {
  flex: 1;
  max-width: 240px;
}
.account {
  margin-top: 24px;
}
.acc-name {
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 8px;
  text-align: center;
}
.setting {
  margin-top: 14px;
  padding: 4px 16px;
}
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 46px;
}
.s-label {
  font-size: 14px;
  color: var(--text-1);
}
</style>
