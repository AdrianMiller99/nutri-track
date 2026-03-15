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

  await authStore.ensureInitialized()
})
</script>

<template>
  <div id="app">
    <SetupErrorScreen v-if="!hasSupabaseConfig" :missing-keys="missingSupabaseEnvVars" />
    <div v-else-if="authStore.loading && !authStore.initialized" class="app-bootstrap">
      <div class="bootstrap-card">
        <h1>{{ $t('app.name') }}</h1>
        <p>{{ $t('auth.loading') }}</p>
      </div>
    </div>
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

.app-bootstrap {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
  background: radial-gradient(circle at top, rgba(255, 209, 102, 0.16), transparent 40%), #0a0a0a;
}

.bootstrap-card {
  width: min(420px, 100%);
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.04);
  text-align: center;
}

.bootstrap-card h1 {
  margin: 0 0 0.75rem;
  font-size: 2rem;
}

.bootstrap-card p {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
}
</style>
