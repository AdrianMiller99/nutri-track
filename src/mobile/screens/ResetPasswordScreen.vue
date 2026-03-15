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

<template>
  <section class="mobile-reset">
    <div class="brand-block">
      <p class="eyebrow">{{ $t('auth.resetPassword.eyebrow') }}</p>
      <h1>{{ $t('auth.resetPassword.title') }}</h1>
      <p>{{ showRecoveryForm ? $t('auth.resetPassword.recoveryDescription') : $t('auth.resetPassword.requestDescription') }}</p>
    </div>

    <div class="reset-card">
      <form v-if="!showRecoveryForm" class="reset-form" @submit.prevent="handleRequestReset">
        <label>
          <span>{{ $t('auth.email') }}</span>
          <input v-model="email" type="email" autocomplete="email" placeholder="you@example.com" required>
        </label>
        <button class="submit-btn" type="submit" :disabled="loading">
          {{ $t('auth.resetPassword.sendLink') }}
        </button>
        <button class="text-link" type="button" @click="pushLocale('/auth')">
          {{ $t('auth.resetPassword.backToSignIn') }}
        </button>
      </form>

      <form v-else class="reset-form" @submit.prevent="handleUpdatePassword">
        <label>
          <span>{{ $t('auth.resetPassword.newPassword') }}</span>
          <input
            v-model="password"
            type="password"
            autocomplete="new-password"
            :placeholder="$t('auth.placeholders.newPassword')"
            required
          >
        </label>
        <label>
          <span>{{ $t('auth.confirmPassword') }}</span>
          <input
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            :placeholder="$t('auth.placeholders.confirmPassword')"
            required
          >
        </label>
        <button class="submit-btn" type="submit" :disabled="loading">
          {{ $t('auth.resetPassword.updateButton') }}
        </button>
      </form>

      <p v-if="invalidRecoveryLink" class="message error">{{ $t('auth.resetPassword.invalidLink') }}</p>
      <p v-if="feedbackError" class="message error">{{ feedbackError }}</p>
      <p v-if="feedbackSuccess" class="message success">{{ feedbackSuccess }}</p>
    </div>
  </section>
</template>

<style scoped>
.mobile-reset {
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
  font-size: 2.6rem;
}

.brand-block p {
  margin: 0.5rem 0 0;
  color: rgba(255, 255, 255, 0.7);
}

.reset-card {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  padding: 1rem;
  backdrop-filter: blur(20px);
}

.reset-form {
  display: grid;
  gap: 0.9rem;
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
  border: none;
  border-radius: 16px;
  padding: 0.95rem 1rem;
  font: inherit;
  font-weight: 700;
  background: #ffffff;
  color: #141414;
}

.text-link {
  width: fit-content;
  padding: 0;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.78);
  font: inherit;
  text-decoration: underline;
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
</style>
