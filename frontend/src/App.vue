<template>
  <n-config-provider :theme="uiTheme" :theme-overrides="themeOverrides" :locale="zhCN" :date-locale="dateZhCN">
    <n-message-provider>
      <n-dialog-provider>
        <div class="app-shell">
          <main class="page-area">
            <router-view />
          </main>
        </div>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { darkTheme, zhCN, dateZhCN } from 'naive-ui'
import { isDark } from '@/utils/theme'

const uiTheme = computed(() => (isDark.value ? darkTheme : null))

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
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
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
</style>
