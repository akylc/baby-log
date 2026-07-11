<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <router-view />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
const themeOverrides = {
  common: {
    primaryColor: '#4f8cff',
    primaryColorHover: '#6ea0ff',
    primaryColorPressed: '#3b78f0',
  },
}
</script>
