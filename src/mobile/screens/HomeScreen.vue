<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLocaleRoute } from '@/shared/composables/useLocaleRoute'

const authStore = useAuthStore()
const { currentLocale, pushLocale } = useLocaleRoute()

const primaryActionLabel = computed(() => (authStore.user ? 'Open diary' : 'Get started'))

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
      <p class="eyebrow">Native Preview</p>
      <h1>Track food fast, one thumb at a time.</h1>
      <p class="copy">
        The mobile app is optimized for quick logging, scanning, and reviewing your day without desktop chrome.
      </p>

      <div class="hero-actions">
        <button class="primary-btn" @click="goPrimary">
          {{ primaryActionLabel }}
        </button>
        <button class="secondary-btn" @click="pushLocale('/auth')">
          {{ authStore.user ? 'Switch account' : 'Sign in' }}
        </button>
      </div>
    </div>

    <div class="highlight-grid">
      <article class="highlight-card">
        <span class="highlight-kicker">Quick add</span>
        <h2>Search and barcode flows are front and center.</h2>
      </article>
      <article class="highlight-card">
        <span class="highlight-kicker">At-a-glance</span>
        <h2>Calories and macros stay visible without scrolling through desktop UI.</h2>
      </article>
      <article class="highlight-card">
        <span class="highlight-kicker">Touch-first</span>
        <h2>Large hit targets, bottom navigation, and sheet-style product details.</h2>
      </article>
    </div>

    <div class="locale-pill">{{ currentLocale.toUpperCase() }}</div>
  </section>
</template>

<style scoped>
.mobile-home {
  min-height: 100vh;
  padding: calc(env(safe-area-inset-top, 0px) + 1.5rem) 1rem 2rem;
  color: white;
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
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
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

.secondary-btn {
  background: rgba(255, 255, 255, 0.06);
  color: white;
}

.highlight-grid {
  display: grid;
  gap: 0.9rem;
  margin-top: 1rem;
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

.locale-pill {
  width: fit-content;
  margin: 1.25rem auto 0;
  padding: 0.55rem 0.85rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
}
</style>
