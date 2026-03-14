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
const showMenu = ref(false)
const { t } = useI18n()
const supportedLocales = ['en', 'de']

const tabItems = computed(() => [
  { label: 'Today', icon: '◎', to: `/${currentLocale.value}/app/dashboard` },
  { label: 'Search', icon: '⌕', to: `/${currentLocale.value}/app/search` },
  { label: 'Lists', icon: '▤', to: `/${currentLocale.value}/app/lists` },
])

const showTabBar = computed(() => authStore.user && route.path.includes('/app/'))
const pageEyebrow = computed(() => {
  if (route.path.endsWith('/app/search')) return t('nav.search')
  if (route.path.endsWith('/app/dashboard')) return t('nav.dashboard')
  if (route.path.endsWith('/app/lists')) return 'Saved lists'
  if (route.path.endsWith('/auth')) return 'Account'
  return 'Nutri Track'
})

const pageTitle = computed(() => {
  if (route.path.endsWith('/app/search') || route.path.endsWith('/app/dashboard')) {
    return formatHeaderDateLabel(dayStore.selectedDate)
  }

  if (route.path.endsWith('/app/lists')) return 'Lists'
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
  closeMenu()
  await authStore.signOut()
  router.push(`/${currentLocale.value}/auth`)
}

function openMenu() {
  showMenu.value = true
  document.documentElement.classList.add('mobile-menu-open')
  document.body.classList.add('mobile-menu-open')
}

function closeMenu() {
  showMenu.value = false
  document.documentElement.classList.remove('mobile-menu-open')
  document.body.classList.remove('mobile-menu-open')
}

function switchLocale(nextLocale) {
  if (!supportedLocales.includes(nextLocale) || nextLocale === currentLocale.value) {
    closeMenu()
    return
  }

  const suffix = route.fullPath.replace(/^\/(en|de)(?=\/|$)/, '') || ''
  closeMenu()
  router.push(`/${nextLocale}${suffix}`)
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
  closeMenu()
  await nextTick()
  updateHeaderHeightVar()
})

onMounted(async () => {
  await nextTick()
  updateHeaderHeightVar()
  window.addEventListener('resize', updateHeaderHeightVar)
})

onUnmounted(() => {
  closeMenu()
  window.removeEventListener('resize', updateHeaderHeightVar)
  document.documentElement.style.setProperty('--mobile-header-height', '0px')
})
</script>

<template>
  <div class="mobile-shell">
    <header v-if="showTabBar" ref="mobileHeader" class="mobile-header">
      <button class="header-icon-btn" aria-label="Open menu" @click="openMenu">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div class="header-copy">
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

    <div v-if="showMenu" class="menu-backdrop" @click="closeMenu">
      <aside class="menu-drawer" @click.stop>
        <div class="menu-header">
          <div>
            <p class="eyebrow">Settings</p>
            <h2>App menu</h2>
          </div>
          <button class="header-icon-btn close-menu-btn" aria-label="Close menu" @click="closeMenu">×</button>
        </div>

        <section class="menu-section">
          <p class="menu-kicker">Language</p>
          <div class="locale-toggle">
            <button
              v-for="locale in supportedLocales"
              :key="locale"
              :class="['locale-btn', { active: locale === currentLocale }]"
              @click="switchLocale(locale)"
            >
              {{ locale === 'en' ? 'English' : 'Deutsch' }}
            </button>
          </div>
        </section>

        <section class="menu-section">
          <p class="menu-kicker">Connections</p>
          <div class="placeholder-card">
            <div>
              <strong>Google Fit</strong>
              <span>Coming soon. Connect activity and health data later.</span>
            </div>
            <small>Placeholder</small>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.mobile-shell {
  min-height: 100vh;
  background: linear-gradient(180deg, #121116 0%, #1a1614 100%);
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

.header-copy {
  flex: 1;
  min-width: 0;
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

.header-icon-btn,
.header-action {
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: white;
  font: inherit;
}

.header-icon-btn {
  flex: 0 0 auto;
  width: 2.95rem;
  height: 2.95rem;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.23rem;
  padding: 0;
}

.header-icon-btn span {
  display: block;
  width: 1.1rem;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
}

.header-action {
  padding: 0.75rem 0.95rem;
}

.mobile-main {
  min-height: 100vh;
}

.mobile-main.with-header {
  padding-top: var(--mobile-header-height, 0px);
}

.mobile-main.with-tabbar {
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 5.75rem);
}

.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.25rem;
  padding: 0.55rem 0.75rem calc(env(safe-area-inset-bottom, 0px) + 0.55rem);
  background: rgba(17, 16, 22, 0.96);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px);
  box-shadow: 0 -12px 28px rgba(0, 0, 0, 0.22);
  z-index: 40;
}

.tabbar-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.68);
  border-radius: 14px;
  padding: 0.7rem 0.5rem 0.55rem;
  transition: background 0.2s ease, color 0.2s ease;
}

.tabbar-link.router-link-active {
  background: rgba(255, 255, 255, 0.08);
  color: #ffd888;
}

.tabbar-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.tabbar-label {
  font-size: 0.82rem;
  font-weight: 700;
}

.menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 110;
  display: flex;
  background: rgba(0, 0, 0, 0.45);
}

.menu-drawer {
  width: min(86vw, 22rem);
  min-height: 100vh;
  padding: calc(env(safe-area-inset-top, 0px) + 1rem) 1rem 1.5rem;
  background: rgba(18, 17, 22, 0.98);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px);
  box-shadow: 24px 0 48px rgba(0, 0, 0, 0.3);
}

.menu-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.menu-header h2 {
  margin: 0;
  font-size: 1.7rem;
  line-height: 1;
}

.close-menu-btn {
  font-size: 1.9rem;
  line-height: 1;
}

.menu-section {
  margin-top: 1.25rem;
}

.menu-kicker {
  margin: 0 0 0.65rem;
  color: rgba(255, 214, 138, 0.85);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.locale-toggle {
  display: grid;
  gap: 0.75rem;
}

.locale-btn {
  border: none;
  border-radius: 18px;
  padding: 0.95rem 1rem;
  background: rgba(255, 255, 255, 0.06);
  color: white;
  font: inherit;
  text-align: left;
}

.locale-btn.active {
  background: rgba(255, 209, 102, 0.16);
  color: #ffd888;
}

.placeholder-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.placeholder-card strong,
.placeholder-card span,
.placeholder-card small {
  display: block;
}

.placeholder-card span,
.placeholder-card small {
  color: rgba(255, 255, 255, 0.66);
}

.placeholder-card span {
  margin-top: 0.35rem;
  line-height: 1.45;
}

:global(html.mobile-menu-open),
:global(body.mobile-menu-open) {
  overflow: hidden;
  overscroll-behavior: none;
}
</style>
