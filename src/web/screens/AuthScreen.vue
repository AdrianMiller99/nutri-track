<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-header">
        <h1>🍎 {{ $t('app.name') }}</h1>
        <p class="tagline">{{ $t('app.tagline') }}</p>
      </div>

      <div class="auth-card">
        <div class="auth-tabs">
          <button
            :class="{ active: mode === 'login' }"
            @click="mode = 'login'"
          >
            {{ $t('auth.signIn') }}
          </button>
          <button
            :class="{ active: mode === 'signup' }"
            @click="mode = 'signup'"
          >
            {{ $t('auth.signUp') }}
          </button>
        </div>

        <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="auth-form">
          <h2>{{ $t('auth.signIn') }}</h2>

          <div class="form-group">
            <label for="login-email">{{ $t('auth.email') }}</label>
            <input
              id="login-email"
              v-model="loginEmail"
              type="email"
              placeholder="your@email.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <label for="login-password">{{ $t('auth.password') }}</label>
            <input
              id="login-password"
              v-model="loginPassword"
              type="password"
              placeholder="••••••••"
              required
              autocomplete="current-password"
              minlength="6"
            />
          </div>

          <button type="submit" class="submit-btn" :disabled="loading">
            {{ $t('auth.signInButton') }}
          </button>

          <button class="text-link" type="button" @click="pushLocale('/auth/reset-password')">
            {{ $t('auth.forgotPassword') }}
          </button>

          <p class="toggle-text">
            <a @click="mode = 'signup'">{{ $t('auth.switchToSignUp') }}</a>
          </p>
        </form>

        <form v-else @submit.prevent="handleSignup" class="auth-form">
          <h2>{{ $t('auth.signUp') }}</h2>

          <div class="form-group">
            <label for="signup-email">{{ $t('auth.email') }}</label>
            <input
              id="signup-email"
              v-model="signupEmail"
              type="email"
              placeholder="your@email.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <label for="signup-password">{{ $t('auth.password') }}</label>
            <input
              id="signup-password"
              v-model="signupPassword"
              type="password"
              placeholder="••••••••"
              required
              autocomplete="new-password"
              minlength="6"
            />
            <small class="hint">{{ $t('auth.errors.weakPassword') }}</small>
          </div>

          <div class="form-group">
            <label for="signup-password-confirm">{{ $t('auth.confirmPassword') }}</label>
            <input
              id="signup-password-confirm"
              v-model="signupPasswordConfirm"
              type="password"
              placeholder="••••••••"
              required
              autocomplete="new-password"
              minlength="6"
            />
          </div>

          <button type="submit" class="submit-btn" :disabled="loading">
            {{ $t('auth.signUpButton') }}
          </button>

          <p class="toggle-text">
            <a @click="mode = 'login'">{{ $t('auth.switchToSignIn') }}</a>
          </p>
        </form>

        <div v-if="feedbackError" class="error-message">
          {{ feedbackError }}
        </div>

        <div v-if="signupSuccess" class="success-message">
          {{ $t('auth.successMessage') }}
          <button @click="signupSuccess = false; mode = 'login'">{{ $t('auth.goToLogin') }}</button>
        </div>
      </div>

      <div class="info-section">
        <h3>{{ $t('auth.whyNutriTrack') }}</h3>
        <div class="features">
          <div class="feature">
            <span class="icon">🔍</span>
            <p>{{ $t('auth.features.search') }}</p>
          </div>
          <div class="feature">
            <span class="icon">📊</span>
            <p>{{ $t('auth.features.track') }}</p>
          </div>
          <div class="feature">
            <span class="icon">📱</span>
            <p>{{ $t('auth.features.mobile') }}</p>
          </div>
          <div class="feature">
            <span class="icon">🔒</span>
            <p>{{ $t('auth.features.secure') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useLocaleRoute } from '@/shared/composables/useLocaleRoute'

const authStore = useAuthStore()
const { t } = useI18n()
const { pushLocale } = useLocaleRoute()

const mode = ref('login')
const loading = ref(false)
const signupSuccess = ref(false)
const feedbackError = ref('')

const loginEmail = ref('')
const loginPassword = ref('')
const signupEmail = ref('')
const signupPassword = ref('')
const signupPasswordConfirm = ref('')

watch(
  () => authStore.user,
  (user) => {
    if (user && !authStore.isRecoveryMode) {
      pushLocale('/app/dashboard')
    }
  },
  { immediate: true }
)

watch(mode, () => {
  feedbackError.value = ''
  signupSuccess.value = false
  authStore.error = null
})

function setErrorMessage(code) {
  if (code === 'account_exists') {
    feedbackError.value = t('auth.errors.accountExists')
    return
  }

  if (code === 'invalid_credentials') {
    feedbackError.value = t('auth.errors.invalidCredentials')
    return
  }

  if (code === 'email_not_confirmed') {
    feedbackError.value = t('auth.errors.emailNotConfirmed')
    return
  }

  feedbackError.value = authStore.error || t('auth.errors.generic')
}

function validateSignup() {
  if (signupPassword.value !== signupPasswordConfirm.value) {
    feedbackError.value = t('auth.errors.passwordMismatch')
    return false
  }

  if (signupPassword.value.length < 6) {
    feedbackError.value = t('auth.errors.weakPassword')
    return false
  }

  return true
}

async function handleLogin() {
  if (loading.value) return

  loading.value = true
  feedbackError.value = ''
  signupSuccess.value = false
  authStore.error = null

  try {
    const result = await authStore.signIn(loginEmail.value, loginPassword.value)
    if (result.ok && result.data?.session) {
      pushLocale('/app/dashboard')
      return
    }

    setErrorMessage(result.code)
  } finally {
    loading.value = false
  }
}

async function handleSignup() {
  if (loading.value) return

  feedbackError.value = ''

  if (!validateSignup()) {
    return
  }

  loading.value = true
  signupSuccess.value = false
  authStore.error = null

  try {
    const result = await authStore.signUp(signupEmail.value, signupPassword.value)
    if (result.ok && result.data?.user) {
      signupSuccess.value = true
      signupEmail.value = ''
      signupPassword.value = ''
      signupPasswordConfirm.value = ''
      return
    }

    setErrorMessage(result.code)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #0a0a0a;
  position: relative;
  overflow: hidden;
}

.auth-page::before,
.auth-page::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float 20s infinite ease-in-out;
  z-index: 0;
}

.auth-page::before {
  width: 500px;
  height: 500px;
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  top: -250px;
  left: -250px;
}

.auth-page::after {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  bottom: -200px;
  right: -200px;
  animation-delay: -7s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(100px, -100px) scale(1.1);
  }
  66% {
    transform: translate(-100px, 100px) scale(0.9);
  }
}

.auth-container {
  width: min(1120px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 440px) minmax(0, 1fr);
  gap: 2rem;
  position: relative;
  z-index: 1;
}

.auth-header {
  display: grid;
  align-content: start;
  gap: 0.75rem;
}

.auth-header h1 {
  margin: 0;
  font-size: 3rem;
}

.tagline {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
}

.auth-card,
.info-section {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.auth-tabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.auth-tabs button {
  border: none;
  border-radius: 14px;
  padding: 0.9rem 1rem;
  font: inherit;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.7);
}

.auth-tabs button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.auth-form {
  display: grid;
  gap: 1rem;
}

.auth-form h2 {
  margin: 0;
}

.form-group {
  display: grid;
  gap: 0.45rem;
}

.form-group label {
  color: rgba(255, 255, 255, 0.72);
}

.form-group input {
  width: 100%;
  padding: 0.95rem 1rem;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  font: inherit;
}

.form-group input:focus {
  outline: none;
  border-color: rgba(102, 126, 234, 0.8);
}

.hint {
  color: rgba(255, 255, 255, 0.52);
}

.submit-btn {
  border: none;
  border-radius: 14px;
  padding: 1rem;
  font: inherit;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.text-link,
.toggle-text a,
.success-message button {
  width: fit-content;
  padding: 0;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.78);
  font: inherit;
  cursor: pointer;
  text-decoration: underline;
}

.toggle-text {
  margin: 0;
}

.error-message,
.success-message {
  margin-top: 1.25rem;
  padding: 1rem;
  border-radius: 16px;
}

.error-message {
  background: rgba(255, 95, 95, 0.12);
  color: #ffb1b1;
}

.success-message {
  display: grid;
  gap: 0.75rem;
  background: rgba(80, 200, 120, 0.14);
  color: #b5efbf;
}

.info-section {
  display: grid;
  gap: 1.25rem;
}

.info-section h3 {
  margin: 0;
}

.features {
  display: grid;
  gap: 1rem;
}

.feature {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.85rem;
  align-items: start;
}

.icon {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.feature p {
  margin: 0;
  color: rgba(255, 255, 255, 0.76);
}

@media (max-width: 960px) {
  .auth-container {
    grid-template-columns: 1fr;
  }
}
</style>
