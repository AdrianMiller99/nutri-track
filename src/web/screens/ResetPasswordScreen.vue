<template>
  <div class="reset-page">
    <div class="reset-container">
      <div class="reset-header">
        <h1>🍎 {{ $t('app.name') }}</h1>
        <p class="tagline">{{ $t('auth.resetPassword.title') }}</p>
        <p class="description">
          {{ showRecoveryForm ? $t('auth.resetPassword.recoveryDescription') : $t('auth.resetPassword.requestDescription') }}
        </p>
      </div>

      <div class="reset-card">
        <form v-if="!showRecoveryForm" @submit.prevent="handleRequestReset" class="reset-form">
          <div class="form-group">
            <label for="reset-email">{{ $t('auth.email') }}</label>
            <input
              id="reset-email"
              v-model="email"
              type="email"
              placeholder="your@email.com"
              required
              autocomplete="email"
            />
          </div>

          <button type="submit" class="submit-btn" :disabled="loading">
            {{ $t('auth.resetPassword.sendLink') }}
          </button>

          <button class="text-link" type="button" @click="pushLocale('/auth')">
            {{ $t('auth.resetPassword.backToSignIn') }}
          </button>
        </form>

        <form v-else @submit.prevent="handleUpdatePassword" class="reset-form">
          <div class="form-group">
            <label for="reset-password">{{ $t('auth.resetPassword.newPassword') }}</label>
            <input
              id="reset-password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              required
              autocomplete="new-password"
              minlength="6"
            />
          </div>

          <div class="form-group">
            <label for="reset-password-confirm">{{ $t('auth.confirmPassword') }}</label>
            <input
              id="reset-password-confirm"
              v-model="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              autocomplete="new-password"
              minlength="6"
            />
          </div>

          <button type="submit" class="submit-btn" :disabled="loading">
            {{ $t('auth.resetPassword.updateButton') }}
          </button>
        </form>

        <div v-if="invalidRecoveryLink" class="error-message">
          {{ $t('auth.resetPassword.invalidLink') }}
        </div>

        <div v-if="feedbackError" class="error-message">
          {{ feedbackError }}
        </div>

        <div v-if="feedbackSuccess" class="success-message">
          {{ feedbackSuccess }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { buildPasswordResetRedirectUrl } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import { useLocaleRoute } from '@/shared/composables/useLocaleRoute'

const authStore = useAuthStore()
const { t } = useI18n()
const { currentLocale, pushLocale } = useLocaleRoute()

const loading = ref(false)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const feedbackError = ref('')
const feedbackSuccess = ref('')

const recoveryLinkPresent = computed(() => {
  if (typeof window === 'undefined') {
    return false
  }

  const hash = window.location.hash || ''
  const search = window.location.search || ''
  return hash.includes('type=recovery') || search.includes('type=recovery') || search.includes('error_code=')
})

const invalidRecoveryLink = computed(
  () => recoveryLinkPresent.value && authStore.initialized && !authStore.isRecoveryMode && !authStore.user
)
const showRecoveryForm = computed(() => authStore.isRecoveryMode || (recoveryLinkPresent.value && !!authStore.user))

onMounted(() => {
  if (recoveryLinkPresent.value && !authStore.isRecoveryMode) {
    void authStore.consumeRecoveryLink(window.location.href)
  }
})

function validatePasswordReset() {
  if (password.value !== confirmPassword.value) {
    feedbackError.value = t('auth.errors.passwordMismatch')
    return false
  }

  if (password.value.length < 6) {
    feedbackError.value = t('auth.errors.weakPassword')
    return false
  }

  return true
}

async function handleRequestReset() {
  if (loading.value) return

  loading.value = true
  feedbackError.value = ''
  feedbackSuccess.value = ''
  authStore.error = null

  try {
    const redirectTo = buildPasswordResetRedirectUrl(currentLocale.value)
    const result = await authStore.requestPasswordReset(email.value, redirectTo)
    if (result.ok) {
      feedbackSuccess.value = t('auth.resetPassword.emailSent')
      email.value = ''
      return
    }

    feedbackError.value = authStore.error || t('auth.errors.generic')
  } finally {
    loading.value = false
  }
}

async function handleUpdatePassword() {
  if (loading.value) return

  feedbackError.value = ''
  feedbackSuccess.value = ''

  if (!validatePasswordReset()) {
    return
  }

  loading.value = true
  authStore.error = null

  try {
    const result = await authStore.updatePassword(password.value)
    if (result.ok) {
      feedbackSuccess.value = t('auth.resetPassword.success')
      password.value = ''
      confirmPassword.value = ''
      await pushLocale('/app/dashboard')
      return
    }

    feedbackError.value = authStore.error || t('auth.errors.generic')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
  background: #0a0a0a;
  position: relative;
  overflow: hidden;
}

.reset-page::before,
.reset-page::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.45;
}

.reset-page::before {
  width: 460px;
  height: 460px;
  top: -220px;
  left: -220px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.reset-page::after {
  width: 360px;
  height: 360px;
  right: -160px;
  bottom: -160px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.reset-container {
  width: min(920px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 320px) minmax(0, 1fr);
  gap: 2rem;
  position: relative;
  z-index: 1;
}

.reset-header,
.reset-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  backdrop-filter: blur(20px);
  padding: 2rem;
}

.reset-header {
  display: grid;
  align-content: start;
  gap: 0.85rem;
}

.reset-header h1,
.tagline,
.description {
  margin: 0;
}

.tagline {
  font-size: 2rem;
}

.description {
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.6;
}

.reset-form {
  display: grid;
  gap: 1rem;
}

.form-group {
  display: grid;
  gap: 0.45rem;
}

.form-group label {
  color: rgba(255, 255, 255, 0.75);
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

.submit-btn {
  border: none;
  border-radius: 14px;
  padding: 1rem;
  font: inherit;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.text-link {
  width: fit-content;
  padding: 0;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.78);
  text-decoration: underline;
  font: inherit;
  cursor: pointer;
}

.error-message,
.success-message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 16px;
}

.error-message {
  background: rgba(255, 95, 95, 0.12);
  color: #ffb1b1;
}

.success-message {
  background: rgba(80, 200, 120, 0.14);
  color: #b5efbf;
}

@media (max-width: 900px) {
  .reset-container {
    grid-template-columns: 1fr;
  }
}
</style>
