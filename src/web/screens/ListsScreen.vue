<script setup>
import { useLocaleRoute } from '@/shared/composables/useLocaleRoute'

const { pushLocale } = useLocaleRoute()
</script>

<template>
  <section class="web-lists">
    <div class="placeholder-card">
      <p class="eyebrow">Lists</p>
      <h1>Saved lists are currently a mobile-first workflow.</h1>
      <p>
        The new list creation and product-saving flow is available in the mobile app shell. Your existing web diary
        experience stays unchanged.
      </p>
      <button @click="pushLocale('/app/dashboard')">Back to dashboard</button>
    </div>
  </section>
</template>

<style scoped>
.web-lists {
  min-height: calc(100vh - 8rem);
  display: grid;
  place-items: center;
  padding: 2rem;
}

.placeholder-card {
  max-width: 42rem;
  border-radius: 32px;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
}

.eyebrow {
  margin: 0 0 0.4rem;
  color: #c86b2d;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: 2rem;
  line-height: 1.1;
}

p {
  color: #475569;
  line-height: 1.6;
}

button {
  border: none;
  border-radius: 999px;
  padding: 0.95rem 1.25rem;
  background: linear-gradient(135deg, #ffd166 0%, #ef8354 100%);
  color: #16110d;
  font: inherit;
  font-weight: 700;
}
</style>
