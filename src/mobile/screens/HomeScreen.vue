<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useLocaleRoute } from '@/shared/composables/useLocaleRoute'

const authStore = useAuthStore()
const { t } = useI18n()
const { currentLocale, router, pushLocale } = useLocaleRoute()

const primaryActionLabel = computed(() => (authStore.user ? t('home.cta.openDiary') : t('home.cta.getStarted')))
function goPrimary() {
  if (authStore.user) {
    pushLocale('/app/dashboard')
    return
  }

  pushLocale('/auth')
}
</script>

<template>
  <section class="mobile-home">
    <div class="hero-card">
      <p class="eyebrow">{{ $t('mobileHome.eyebrow') }}</p>
      <h1>{{ $t('mobileHome.title') }}</h1>
      <p class="copy">{{ $t('mobileHome.copy') }}</p>

      <div class="hero-actions">
        <button class="primary-btn" @click="goPrimary">
          {{ primaryActionLabel }}
        </button>
      </div>
    </div>

    <div class="highlight-grid">
      <article class="highlight-card">
        <span class="highlight-kicker">{{ $t('mobileHome.cards.quickAdd.kicker') }}</span>
        <h2>{{ $t('mobileHome.cards.quickAdd.title') }}</h2>
      </article>
      <article class="highlight-card">
        <span class="highlight-kicker">{{ $t('mobileHome.cards.glance.kicker') }}</span>
        <h2>{{ $t('mobileHome.cards.glance.title') }}</h2>
      </article>
      <article class="highlight-card">
        <span class="highlight-kicker">{{ $t('mobileHome.cards.touchFirst.kicker') }}</span>
        <h2>{{ $t('mobileHome.cards.touchFirst.title') }}</h2>
      </article>
    </div>
  </section>
</template>

<style scoped>
.mobile-home {
  min-height: 100vh;
  padding: calc(env(safe-area-inset-top, 0px) + 1.25rem) 1rem calc(env(safe-area-inset-bottom, 0px) + 1.25rem);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.9rem;
}

.hero-card {
  background: linear-gradient(160deg, rgba(255, 196, 88, 0.18), rgba(255, 255, 255, 0.06));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  padding: 1.5rem;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
}

.eyebrow,
.highlight-kicker {
  margin: 0;
  color: rgba(255, 218, 132, 0.88);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1 {
  margin: 0.85rem 0 0.75rem;
  font-size: clamp(2.2rem, 10vw, 3.4rem);
  line-height: 0.95;
}

.copy {
  margin: 0;
  color: rgba(255, 255, 255, 0.74);
  line-height: 1.6;
}

.hero-actions {
  display: grid;
  grid-template-columns: 1fr;
  margin-top: 1.5rem;
}

button {
  border: none;
  border-radius: 18px;
  padding: 1rem;
  font: inherit;
  font-weight: 700;
}

.primary-btn {
  background: linear-gradient(135deg, #ffd166 0%, #ef8354 100%);
  color: #1a1511;
}

.highlight-grid {
  display: grid;
  gap: 0.75rem;
}

.highlight-card {
  border-radius: 24px;
  padding: 1.2rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.highlight-card h2 {
  margin: 0.6rem 0 0;
  font-size: 1.15rem;
  line-height: 1.3;
}

</style>
