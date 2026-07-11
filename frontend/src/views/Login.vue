<template>
  <div class="login">
    <div class="brand">
      <div class="logo">🍼</div>
      <h1>喂养记录</h1>
      <p>记录宝宝每一天的小日子</p>
    </div>
    <n-form class="form">
      <n-form-item>
        <n-input v-model:value="username" placeholder="用户名" size="large" />
      </n-form-item>
      <n-form-item>
        <n-input
          v-model:value="password"
          type="password"
          placeholder="密码（至少6位）"
          size="large"
          show-password-on="click"
        />
      </n-form-item>
      <n-button type="primary" size="large" block :loading="loading" @click="submit">
        {{ isRegister ? '注册' : '登录' }}
      </n-button>
      <div class="switch" @click="isRegister = !isRegister">
        {{ isRegister ? '已有账号？去登录' : '没有账号？注册一个' }}
      </div>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import { useBabyStore } from '@/stores/baby'

const router = useRouter()
const message = useMessage()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const isRegister = ref(false)
const loading = ref(false)

async function submit() {
  if (!username.value.trim() || !password.value) {
    message.warning('请填写用户名和密码')
    return
  }
  loading.value = true
  try {
    if (isRegister.value) await auth.register(username.value.trim(), password.value)
    else await auth.login(username.value.trim(), password.value)
    // 登录后预热全局 store（记录页依赖宝宝；刷新后需补拉用户信息）
    auth.fetchMe().catch(() => {})
    useBabyStore().fetch().catch(() => {})
    message.success('欢迎～')
    router.replace('/')
  } catch (e: any) {
    message.error(e?.message || '操作失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login {
  min-height: 100%;
  padding: 64px 28px 28px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #ffe3ec 0%, #f6f7fb 45%);
}
.brand {
  text-align: center;
  margin-bottom: 40px;
}
.logo {
  font-size: 56px;
}
.brand h1 {
  margin: 12px 0 4px;
  font-size: 24px;
  color: #ff5c8a;
}
.brand p {
  margin: 0;
  color: #9aa0ad;
  font-size: 13px;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.switch {
  text-align: center;
  margin-top: 16px;
  color: #ff7aa2;
  font-size: 13px;
}
</style>
