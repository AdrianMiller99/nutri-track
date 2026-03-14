<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useDayStore } from '@/stores/day'
import { useLocaleRoute } from '@/shared/composables/useLocaleRoute'

const authStore = useAuthStore()
const dayStore = useDayStore()
const { route, router, currentLocale } = useLocaleRoute()
const mobileHeader = ref(null)
const { t } = useI18n()

const tabItems = computed(() => [
  { label: 'Today', icon: '◎', to: `/${currentLocale.value}/app/dashboard` },
  { label: 'Search', icon: '⌕', to: `/${currentLocale.value}/app/search` },
])

const showTabBar = computed(() => authStore.user && route.path.includes('/app/'))
const pageEyebrow = computed(() => {
  if (route.path.endsWith('/app/search')) return t('nav.search')
  if (route.path.endsWith('/app/dashboard')) return t('nav.dashboard')
  if (route.path.endsWith('/auth')) return 'Account'
  return 'Nutri Track'
})

const pageTitle = computed(() => {
  if (route.path.includes('/app/')) {
    return formatHeaderDateLabel(dayStore.selectedDate)
  }

  if (route.path.endsWith('/auth')) return 'Account'
  return 'Nutri Track'
})

function formatHeaderDateLabel(dateString) {
  const today = getRelativeDateString(0)
  const yesterday = getRelativeDateString(-1)

  if (dateString === today) {
    return t('dashboard.today')
  }

  if (dateString === yesterday) {
    return t('dashboard.yesterday')
  }

  const [year, month, day] = dateString.split('-')
  return `${day}.${month}.${year}`
}

function getRelativeDateString(dayOffset) {
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function logout() {
  await authStore.signOut()
  router.push(`/${currentLocale.value}/auth`)
}

function updateHeaderHeightVar() {
  const headerHeight = showTabBar.value && mobileHeader.value ? `${mobileHeader.value.offsetHeight}px` : '0px'
  document.documentElement.style.setProperty('--mobile-header-height', headerHeight)
}

watch(showTabBar, async () => {
  await nextTick()
  updateHeaderHeightVar()
})

watch(() => route.fullPath, async () => {
  await nextTick()
  updateHeaderHeightVar()
})

onMounted(async () => {
  await nextTick()
  updateHeaderHeightVar()
  window.addEventListener('resize', updateHeaderHeightVar)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateHeaderHeightVar)
  document.documentElement.style.setProperty('--mobile-header-height', '0px')
})
</script>

<template>
  <div class="mobile-shell">
    <header v-if="showTabBar" ref="mobileHeader" class="mobile-header">
      <div>
        <p class="eyebrow">{{ pageEyebrow }}</p>
        <h1>{{ pageTitle }}</h1>
      </div>
      <button class="header-action" @click="logout">Log out</button>
    </header>

    <main :class="['mobile-main', { 'with-tabbar': showTabBar, 'with-header': showTabBar }]">
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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 90;
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

.mobile-main.with-header {
  padding-top: var(--mobile-header-height, 0px);
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
