<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <div class="app-shell">
          <main class="page-area">
            <router-view />
          </main>
          <nav v-if="showTab" class="tab-bar">
            <router-link to="/" class="tab-item" :class="{ active: route.name === 'home' }">
              <span class="ic">🏠</span><span class="lb">首页</span>
            </router-link>
            <router-link to="/record" class="tab-item" :class="{ active: route.name === 'record' }">
              <span class="ic">➕</span><span class="lb">记录</span>
            </router-link>
            <router-link to="/baby" class="tab-item" :class="{ active: route.name === 'baby' }">
              <span class="ic">👤</span><span class="lb">我的</span>
            </router-link>
          </nav>
        </div>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const showTab = computed(() => route.name !== 'login')
const themeOverrides = {
  common: {
    primaryColor: '#ff7aa2',
    primaryColorHover: '#ff95b8',
    primaryColorPressed: '#f25c8a',
    borderRadius: '12px',
  },
}
</script>

<style scoped>
.app-shell {
  max-width: 480px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f6f7fb;
  position: relative;
  box-shadow: 0 0 24px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}
.page-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.tab-bar {
  flex: none;
  height: 58px;
  display: flex;
  border-top: 1px solid #eceef3;
  background: #fff;
}
.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-decoration: none;
  color: #9aa0ad;
  font-size: 11px;
}
.tab-item .ic {
  font-size: 20px;
  line-height: 1;
}
.tab-item.active {
  color: #ff7aa2;
}
</style>
