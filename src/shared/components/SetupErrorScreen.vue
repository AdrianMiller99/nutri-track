<script setup>
defineProps({
  missingKeys: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <div class="config-error-screen">
    <div class="config-error-card">
      <p class="config-error-eyebrow">Configuration Error</p>
      <h1>Supabase environment variables are missing</h1>
      <p class="config-error-copy">
        This app needs a local <code>.env</code> file before it can start.
      </p>
      <p class="config-error-copy">
        Missing keys: {{ missingKeys.join(', ') }}
      </p>
      <p class="config-error-copy">
        Create <code>.env</code> from <code>.env.example</code>, add your Supabase values, then rebuild the app.
      </p>
    </div>
  </div>
</template>

<style scoped>
.config-error-screen {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
}

.config-error-card {
  width: min(640px, 100%);
  background: rgba(18, 18, 18, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

.config-error-eyebrow {
  color: #ff9d7a;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
}

h1 {
  font-size: clamp(1.75rem, 5vw, 2.5rem);
  margin-bottom: 1rem;
}

.config-error-copy {
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.6;
  margin-top: 0.75rem;
}

.config-error-copy code {
  color: #ffffff;
}
</style>
