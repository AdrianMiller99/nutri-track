<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { hasSupabaseConfig, missingSupabaseEnvVars } from '@/lib/supabaseClient'
import { useSurface } from '@/shared/platform/surface'
import SetupErrorScreen from '@/shared/components/SetupErrorScreen.vue'
import WebAppShell from '@/web/layouts/WebAppShell.vue'
import MobileAppShell from '@/mobile/layouts/MobileAppShell.vue'

const authStore = useAuthStore()
const { isMobileSurface } = useSurface()

const activeShell = computed(() => (isMobileSurface.value ? MobileAppShell : WebAppShell))

onMounted(async () => {
  if (!hasSupabaseConfig) {
    return
  }

  // Initialize auth state
  await authStore.init()
})
</script>

<template>
  <div id="app">
    <SetupErrorScreen v-if="!hasSupabaseConfig" :missing-keys="missingSupabaseEnvVars" />
    <component :is="activeShell" v-else />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #0a0a0a;
  color: #ffffff;
}

#app {
  min-height: 100vh;
}
</style>
