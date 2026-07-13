<template>
  <n-config-provider :theme="uiTheme" :theme-overrides="themeOverrides" :locale="zhCN" :date-locale="dateZhCN">
    <n-message-provider>
      <n-dialog-provider>
        <div class="app-shell">
          <main class="page-area">
            <router-view v-slot="{ Component }">
              <!-- 只缓存首页 Home：返回时不重建组件（列表不闪空），由 onActivated 触发刷新 -->
              <keep-alive include="Home">
                <component :is="Component" />
              </keep-alive>
            </router-view>
          </main>
        </div>

        <!-- 版本过低：不可关闭的弹框，强制刷新以加载最新版本，避免前后端数据不一致 -->
        <n-modal
          v-model:show="versionStale"
          preset="card"
          title="⚠️ 当前版本过低"
          :closable="false"
          :mask-closable="false"
          :close-on-esc="false"
          style="max-width: 360px"
        >
          <p class="vs-text">检测到前后端版本不一致，请刷新页面以加载最新版本，避免数据异常。</p>
          <p class="vs-ver" v-if="clientVersion || serverVersion">
            当前版本 v{{ clientVersion }} · 最新版本 v{{ serverVersion }}
          </p>
          <template #action>
            <n-button type="primary" block size="large" @click="reloadPage">刷新页面</n-button>
          </template>
        </n-modal>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { darkTheme, zhCN, dateZhCN, NModal, NButton } from 'naive-ui'
import { isDark } from '@/utils/theme'
import { versionStale, serverVersion, clientVersion } from '@/utils/version'

const uiTheme = computed(() => (isDark.value ? darkTheme : null))

// 版本过低弹框：点击刷新按钮强制重新加载页面，拉取最新前端（版本与后端对齐）
function reloadPage() {
  location.reload()
}

const themeOverrides = computed(() => {
  const common = {
    primaryColor: '#ff7aa2',
    primaryColorHover: '#ff95b8',
    primaryColorPressed: '#f25c8a',
    borderRadius: '12px',
  }
  // 主按钮（保存/保存记录）文字：浅色用纯白保证清晰；深色用柔和浅灰避免刺眼
  const buttonLight = { textColorPrimary: '#ffffff' }
  const buttonDark = {
    colorPrimary: '#e35d8a',
    colorHoverPrimary: '#ef7aa2',
    colorPressedPrimary: '#cf4f7c',
    colorFocusPrimary: '#e35d8a',
    textColorPrimary: '#f4f1f3',
    textColorHoverPrimary: '#f4f1f3',
    textColorPressedPrimary: '#f4f1f3',
    textColorFocusPrimary: '#f4f1f3',
  }
  if (!isDark.value) return { common, Button: buttonLight }
  // 暗色下：文字整体压暗一档，输入框背景更深，避免白色刺眼
  return {
    common: {
      ...common,
      textColorBase: '#b6bac4',
      textColor1: '#9ca2ad',
      textColor2: '#8b919e',
      textColor3: '#6b7180',
    },
    Button: buttonDark,
    Input: {
      color: '#23252b',
      colorFocus: '#2a2d34',
      textColor: '#b8bdc8',
      placeholderColor: '#6b7180',
      border: '1px solid #2c2f38',
      borderHover: '1px solid #3a3e48',
      borderFocus: '1px solid #ff7aa2',
    },
  }
})
</script>

<style scoped>
.app-shell {
  max-width: 480px;
  margin: 0 auto;
  /* 高度优先用 100dvh（动态视口）贴合 Safari 地址栏收起后的真实可见高度，
     100vh 仅作旧浏览器兜底。 */
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  position: relative;
  box-shadow: 0 0 24px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  /* 状态栏安全区：仅顶部预留，把内容推到状态栏之下，避免与状态栏重叠。
     底部安全区在此统一预留一次（所有页面通用，含首页 build-info / 各页底部内容），
     页面内容自身不要再重复加 safe-area-inset-bottom，否则既留空过大，又会让
     滚动容器被多算一截而在 iOS 独立模式下冒出 phantom 滚动条。 */
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.page-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  /* 阻止滚动到顶/底时的橡皮筋把滚动条「顶」出来，避免 phantom 滚动条 */
  overscroll-behavior-y: contain;
}
/* 版本过低弹框内容 */
.vs-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-2);
  margin: 0;
}
.vs-ver {
  font-size: 12px;
  color: var(--text-3);
  margin: 10px 0 0;
}
</style>
