<script setup>
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLocaleRoute } from '@/shared/composables/useLocaleRoute'

const authStore = useAuthStore()
const { pushLocale } = useLocaleRoute()

const mode = ref('login')
const loading = ref(false)
const signupSuccess = ref(false)

const loginEmail = ref('')
const loginPassword = ref('')
const signupEmail = ref('')
const signupPassword = ref('')
const signupPasswordConfirm = ref('')

watch(
  () => authStore.user,
  (user) => {
    if (user) {
      pushLocale('/app/dashboard')
    }
  },
  { immediate: true }
)

async function handleLogin() {
  if (loading.value) return

  loading.value = true
  authStore.error = null

  try {
    const result = await authStore.signIn(loginEmail.value, loginPassword.value)
    if (result && !authStore.error) {
      pushLocale('/app/dashboard')
    }
  } finally {
    loading.value = false
  }
}

async function handleSignup() {
  if (loading.value) return

  if (signupPassword.value !== signupPasswordConfirm.value) {
    authStore.error = 'Passwords do not match'
    return
  }

  if (signupPassword.value.length < 6) {
    authStore.error = 'Password must be at least 6 characters'
    return
  }

  loading.value = true
  authStore.error = null

  try {
    const result = await authStore.signUp(signupEmail.value, signupPassword.value)
    if (result && !authStore.error) {
      signupSuccess.value = true
      mode.value = 'login'
      signupEmail.value = ''
      signupPassword.value = ''
      signupPasswordConfirm.value = ''
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="mobile-auth">
    <div class="brand-block">
      <p class="eyebrow">Mobile App</p>
      <h1>{{ $t('app.name') }}</h1>
      <p>{{ $t('app.tagline') }}</p>
    </div>

    <div class="auth-card">
      <div class="auth-tabs">
        <button :class="{ active: mode === 'login' }" @click="mode = 'login'">{{ $t('auth.signIn') }}</button>
        <button :class="{ active: mode === 'signup' }" @click="mode = 'signup'">{{ $t('auth.signUp') }}</button>
      </div>

      <form v-if="mode === 'login'" class="auth-form" @submit.prevent="handleLogin">
        <label>
          <span>{{ $t('auth.email') }}</span>
          <input v-model="loginEmail" type="email" autocomplete="email" placeholder="you@example.com" required>
        </label>
        <label>
          <span>{{ $t('auth.password') }}</span>
          <input v-model="loginPassword" type="password" autocomplete="current-password" placeholder="••••••••" required>
        </label>
        <button class="submit-btn" type="submit" :disabled="loading">{{ $t('auth.signInButton') }}</button>
      </form>

      <form v-else class="auth-form" @submit.prevent="handleSignup">
        <label>
          <span>{{ $t('auth.email') }}</span>
          <input v-model="signupEmail" type="email" autocomplete="email" placeholder="you@example.com" required>
        </label>
        <label>
          <span>{{ $t('auth.password') }}</span>
          <input v-model="signupPassword" type="password" autocomplete="new-password" placeholder="At least 6 characters" required>
        </label>
        <label>
          <span>{{ $t('auth.confirmPassword') }}</span>
          <input v-model="signupPasswordConfirm" type="password" autocomplete="new-password" placeholder="Repeat your password" required>
        </label>
        <button class="submit-btn" type="submit" :disabled="loading">{{ $t('auth.signUpButton') }}</button>
      </form>

      <p v-if="authStore.error" class="message error">{{ authStore.error }}</p>
      <p v-if="signupSuccess" class="message success">{{ $t('auth.successMessage') }}</p>
    </div>

    <div class="trust-grid">
      <article>
        <strong>Fast capture</strong>
        <span>Search or scan from the phone in a couple of taps.</span>
      </article>
      <article>
        <strong>Private account</strong>
        <span>Your diary stays tied to your authenticated Supabase user.</span>
      </article>
    </div>
  </section>
</template>

<style scoped>
.mobile-auth {
  min-height: 100vh;
  padding: calc(env(safe-area-inset-top, 0px) + 1.5rem) 1rem 2rem;
  color: white;
}

.brand-block {
  margin-bottom: 1.25rem;
}

.eyebrow {
  margin: 0 0 0.5rem;
  color: rgba(255, 212, 130, 0.88);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.brand-block h1 {
  margin: 0;
  font-size: 2.75rem;
}

.brand-block p {
  margin: 0.5rem 0 0;
  color: rgba(255, 255, 255, 0.7);
}

.auth-card {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  padding: 1rem;
  backdrop-filter: blur(20px);
}

.auth-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  padding: 0.35rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
}

.auth-tabs button,
.submit-btn {
  border: none;
  border-radius: 16px;
  padding: 0.95rem 1rem;
  font: inherit;
  font-weight: 700;
}

.auth-tabs button {
  background: transparent;
  color: rgba(255, 255, 255, 0.65);
}

.auth-tabs button.active {
  background: linear-gradient(135deg, #f4b942 0%, #ef8354 100%);
  color: #16110d;
}

.auth-form {
  display: grid;
  gap: 0.9rem;
  margin-top: 1rem;
}

label span {
  display: block;
  margin-bottom: 0.45rem;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.74);
}

input {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  padding: 1rem;
  font: inherit;
}

input:focus {
  outline: none;
  border-color: rgba(255, 209, 102, 0.7);
}

.submit-btn {
  margin-top: 0.2rem;
  background: #ffffff;
  color: #141414;
}

.message {
  margin: 0.9rem 0 0;
  padding: 0.9rem 1rem;
  border-radius: 16px;
  font-size: 0.92rem;
}

.message.error {
  background: rgba(255, 95, 95, 0.12);
  color: #ff9e9e;
}

.message.success {
  background: rgba(80, 200, 120, 0.14);
  color: #9fe1a9;
}

.trust-grid {
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;
}

.trust-grid article {
  display: grid;
  gap: 0.35rem;
  padding: 1rem 1.1rem;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.trust-grid span {
  color: rgba(255, 255, 255, 0.68);
  line-height: 1.5;
}
</style>
