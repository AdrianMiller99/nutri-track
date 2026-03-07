<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLocaleRoute } from '@/shared/composables/useLocaleRoute'

const authStore = useAuthStore()
const { route, router, currentLocale } = useLocaleRoute()

const tabItems = computed(() => [
  { label: 'Today', icon: '◎', to: `/${currentLocale.value}/app/dashboard` },
  { label: 'Search', icon: '⌕', to: `/${currentLocale.value}/app/search` },
])

const showTabBar = computed(() => authStore.user && route.path.includes('/app/'))
const pageTitle = computed(() => {
  if (route.path.endsWith('/app/search')) return 'Search'
  if (route.path.endsWith('/app/dashboard')) return 'Today'
  if (route.path.endsWith('/auth')) return 'Account'
  return 'Nutri Track'
})

async function logout() {
  await authStore.signOut()
  router.push(`/${currentLocale.value}/auth`)
}
</script>

<template>
  <div class="mobile-shell">
    <header v-if="showTabBar" class="mobile-header">
      <div>
        <p class="eyebrow">Nutri Track</p>
        <h1>{{ pageTitle }}</h1>
      </div>
      <button class="header-action" @click="logout">Log out</button>
    </header>

    <main :class="['mobile-main', { 'with-tabbar': showTabBar }]">
      <router-view />
    </main>

    <nav v-if="showTabBar" class="tabbar">
      <router-link
        v-for="item in tabItems"
        :key="item.label"
        :to="item.to"
        class="tabbar-link"
      >
        <span class="tabbar-icon">{{ item.icon }}</span>
        <span class="tabbar-label">{{ item.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<style scoped>
.mobile-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(245, 179, 58, 0.22), transparent 30%),
    radial-gradient(circle at top right, rgba(58, 134, 255, 0.22), transparent 32%),
    linear-gradient(180deg, #121116 0%, #1a1614 100%);
}

.mobile-header {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: calc(env(safe-area-inset-top, 0px) + 1rem) 1rem 1rem;
  background: rgba(18, 17, 22, 0.86);
  backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.eyebrow {
  margin: 0 0 0.25rem;
  color: rgba(255, 219, 140, 0.88);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.mobile-header h1 {
  margin: 0;
  font-size: 1.75rem;
  line-height: 1;
}

.header-action {
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: white;
  padding: 0.75rem 0.95rem;
  font: inherit;
}

.mobile-main {
  min-height: 100vh;
}

.mobile-main.with-tabbar {
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 6.5rem);
}

.tabbar {
  position: fixed;
  left: 1rem;
  right: 1rem;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 0.9rem);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 24px;
  background: rgba(18, 17, 22, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
  z-index: 40;
}

.tabbar-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.68);
  border-radius: 18px;
  padding: 0.8rem 0.5rem;
  transition: background 0.2s ease, color 0.2s ease;
}

.tabbar-link.router-link-active {
  background: linear-gradient(135deg, #f4b942 0%, #ec6f4f 100%);
  color: #111111;
}

.tabbar-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.tabbar-label {
  font-size: 0.82rem;
  font-weight: 700;
}
</style>
