<template>
  <div class="baby">
    <header class="hd">
      <span style="width: 48px"></span>
      <span class="title">我的</span>
      <span style="width: 48px"></span>
    </header>

    <div class="card">
      <div class="field">
        <label>宝宝名字</label>
        <n-input v-model:value="name" placeholder="如 小葡萄" />
      </div>
      <div class="field">
        <label>生日</label>
        <n-date-picker v-model:value="birthdayTs" type="date" format="yyyy-MM-dd" clearable />
      </div>
      <div class="field">
        <label>性别</label>
        <div class="seg">
          <button
            v-for="o in genderOpts"
            :key="o.value"
            :class="['seg-btn', { active: gender === o.value }]"
            @click="gender = o.value"
          >
            {{ o.label }}
          </button>
        </div>
      </div>
      <n-button type="primary" block size="large" :loading="loading" @click="save">保存</n-button>
    </div>

    <div class="account">
      <div class="acc-name">账号：{{ auth.user?.username || '—' }}</div>
      <n-button block @click="logout">退出登录</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useBabyStore } from '@/stores/baby'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const message = useMessage()
const babyStore = useBabyStore()
const auth = useAuthStore()

const genderOpts = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'unknown', label: '未知' },
]
const name = ref('')
const birthdayTs = ref<number | null>(null)
const gender = ref<'male' | 'female' | 'unknown'>('unknown')
const loading = ref(false)

onMounted(async () => {
  // 刷新后 auth.user 会丢失，这里补拉当前用户信息，避免账号显示异常
  if (!auth.user) await auth.fetchMe()
  await babyStore.fetch()
  const b = babyStore.baby
  if (b) {
    name.value = b.name
    birthdayTs.value = b.birthday ? new Date(b.birthday).getTime() : null
    gender.value = b.gender
  }
})

function fmtDate(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

async function save() {
  if (!name.value.trim()) {
    message.warning('请填写宝宝名字')
    return
  }
  loading.value = true
  try {
    await babyStore.save({
      name: name.value.trim(),
      birthday: birthdayTs.value ? fmtDate(birthdayTs.value) : null,
      gender: gender.value,
    })
    message.success('已保存')
  } catch (e: any) {
    message.error(e?.message || '保存失败')
  } finally {
    loading.value = false
  }
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
.card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field label {
  font-size: 13px;
  color: #6b7180;
}
.seg {
  display: flex;
  gap: 8px;
}
.seg-btn {
  flex: 1;
  border: 1px solid #e6e8ef;
  background: #fff;
  border-radius: 10px;
  padding: 10px;
  font-size: 13px;
  color: #4a4f5c;
  cursor: pointer;
}
.seg-btn.active {
  background: #fff0f5;
  border-color: #ff7aa2;
  color: #ff5c8a;
  font-weight: 600;
}
.account {
  margin-top: 24px;
}
.acc-name {
  font-size: 13px;
  color: #6b7180;
  margin-bottom: 8px;
  text-align: center;
}
</style>
