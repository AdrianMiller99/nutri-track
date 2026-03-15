import { defineStore } from 'pinia'
import {
  buildAuthRedirectUrl,
  getAuthSessionTokensFromUrl,
  hasRecoveryCallback,
  hasSupabaseConfig,
  supabase,
  supabaseConfigError,
} from '@/lib/supabaseClient'
import { useDayStore } from './day'
import { useFoodStore } from './food'
import { useListsStore } from './lists'

let authInitPromise = null
let authStateSubscription = null

function makeResult({ ok, data = null, error = null, code = null, outcome = null }) {
  return { ok, data, error, code, outcome }
}

function getConfigErrorResult() {
  return makeResult({
    ok: false,
    error: new Error(supabaseConfigError),
    code: 'config_missing',
  })
}

function getErrorMessage(error) {
  if (!error) {
    return ''
  }

  if (typeof error === 'string') {
    return error
  }

  return error.message || String(error)
}

function getLocaleFromWindowPath() {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const match = window.location.pathname.match(/(^|\/)(en|de)(?=\/|$)/)
  return match?.[2] || 'en'
}

function hasRecoveryLinkInCurrentLocation() {
  return hasRecoveryCallback()
}

function mapSignInError(error) {
  const message = getErrorMessage(error).toLowerCase()

  if (message.includes('email not confirmed')) {
    return 'email_not_confirmed'
  }

  if (message.includes('invalid login credentials') || message.includes('invalid login or password')) {
    return 'invalid_credentials'
  }

  return 'unexpected_error'
}

function clearUserScopedState() {
  useDayStore().clearState()
  useListsStore().clearState()
  useFoodStore().clearState()
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: true,
    initialized: false,
    error: null,
    lastAuthEvent: null,
    isRecoveryMode: false,
  }),
  actions: {
    setSessionState(event, session) {
      this.lastAuthEvent = event
      this.user = session?.user ?? null

      const shouldEnterRecoveryMode = event === 'PASSWORD_RECOVERY'
        || (session?.user && hasRecoveryLinkInCurrentLocation() && ['INITIAL_SESSION', 'SIGNED_IN', 'TOKEN_REFRESHED'].includes(event))

      if (shouldEnterRecoveryMode) {
        this.isRecoveryMode = true
        return
      }

      if (event === 'SIGNED_OUT') {
        this.isRecoveryMode = false
        clearUserScopedState()
        return
      }

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        this.isRecoveryMode = false
      }
    },

    async init() {
      if (!hasSupabaseConfig) {
        this.error = supabaseConfigError
        this.loading = false
        this.initialized = true
        return
      }

      if (!authStateSubscription) {
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
          this.setSessionState(event, session)
          this.loading = false
          this.initialized = true
        })

        authStateSubscription = data.subscription
      }

      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        this.error = error.message
      } else {
        this.error = null
      }

      this.setSessionState(hasRecoveryLinkInCurrentLocation() && session ? 'PASSWORD_RECOVERY' : 'INITIAL_SESSION', session)
      this.loading = false
      this.initialized = true
    },

    ensureInitialized() {
      if (this.initialized) {
        return Promise.resolve()
      }

      if (!authInitPromise) {
        this.loading = true
        authInitPromise = this.init().finally(() => {
          authInitPromise = null
        })
      }

      return authInitPromise
    },

    async checkEmailStatus(email) {
      const { data, error } = await supabase.functions.invoke('check-auth-email', {
        body: { email },
      })

      if (error) {
        throw error
      }

      return data?.status || 'available'
    },

    async signUp(email, password) {
      if (!hasSupabaseConfig) {
        this.error = supabaseConfigError
        return getConfigErrorResult()
      }

      this.error = null

      try {
        const emailStatus = await this.checkEmailStatus(email)
        if (emailStatus === 'confirmed_account') {
          return makeResult({
            ok: false,
            code: 'account_exists',
            outcome: 'confirmed_account',
          })
        }

        const emailRedirectTo = buildAuthRedirectUrl(getLocaleFromWindowPath(), '/auth')
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: emailRedirectTo || undefined,
          },
        })
        if (error) {
          this.error = error.message
          return makeResult({
            ok: false,
            error,
            code: 'unexpected_error',
          })
        }

        return makeResult({
          ok: true,
          data,
          outcome: emailStatus === 'unconfirmed_account' ? 'unconfirmed_account' : 'signup_success',
        })
      } catch (error) {
        this.error = getErrorMessage(error)
        return makeResult({
          ok: false,
          error,
          code: 'unexpected_error',
        })
      }
    },

    async signIn(email, password) {
      if (!hasSupabaseConfig) {
        this.error = supabaseConfigError
        return getConfigErrorResult()
      }

      this.error = null

      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          const code = mapSignInError(error)
          if (code === 'unexpected_error') {
            this.error = error.message
          }

          return makeResult({
            ok: false,
            error,
            code,
          })
        }

        return makeResult({
          ok: true,
          data,
          outcome: 'signed_in',
        })
      } catch (error) {
        this.error = getErrorMessage(error)
        return makeResult({
          ok: false,
          error,
          code: 'unexpected_error',
        })
      }
    },

    async requestPasswordReset(email, redirectTo) {
      if (!hasSupabaseConfig) {
        this.error = supabaseConfigError
        return getConfigErrorResult()
      }

      this.error = null

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
        })

        if (error) {
          this.error = error.message
          return makeResult({
            ok: false,
            error,
            code: 'unexpected_error',
          })
        }

        return makeResult({
          ok: true,
          code: 'reset_email_sent',
          outcome: 'reset_email_sent',
        })
      } catch (error) {
        this.error = getErrorMessage(error)
        return makeResult({
          ok: false,
          error,
          code: 'unexpected_error',
        })
      }
    },

    async consumeRecoveryLink(url) {
      if (!hasSupabaseConfig) {
        this.error = supabaseConfigError
        return getConfigErrorResult()
      }

      this.error = null

      try {
        if (!hasRecoveryCallback(url)) {
          return makeResult({
            ok: false,
            code: 'not_recovery_link',
          })
        }

        const sessionTokens = getAuthSessionTokensFromUrl(url)
        if (sessionTokens) {
          const { data, error } = await supabase.auth.setSession(sessionTokens)
          if (error) {
            this.error = error.message
            return makeResult({
              ok: false,
              error,
              code: 'unexpected_error',
            })
          }

          this.setSessionState('PASSWORD_RECOVERY', data.session)

          return makeResult({
            ok: true,
            data,
            code: 'recovery_session_restored',
            outcome: 'recovery_session_restored',
          })
        }

        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          this.error = error.message
          return makeResult({
            ok: false,
            error,
            code: 'unexpected_error',
          })
        }

        if (session?.user) {
          this.setSessionState('PASSWORD_RECOVERY', session)
          return makeResult({
            ok: true,
            data: { session },
            code: 'recovery_session_restored',
            outcome: 'recovery_session_restored',
          })
        }

        return makeResult({
          ok: false,
          code: 'recovery_session_missing',
        })
      } catch (error) {
        this.error = getErrorMessage(error)
        return makeResult({
          ok: false,
          error,
          code: 'unexpected_error',
        })
      }
    },

    async updatePassword(password) {
      if (!hasSupabaseConfig) {
        this.error = supabaseConfigError
        return getConfigErrorResult()
      }

      this.error = null

      try {
        const { data, error } = await supabase.auth.updateUser({ password })
        if (error) {
          this.error = error.message
          return makeResult({
            ok: false,
            error,
            code: 'unexpected_error',
          })
        }

        this.isRecoveryMode = false

        return makeResult({
          ok: true,
          data,
          code: 'password_updated',
          outcome: 'password_updated',
        })
      } catch (error) {
        this.error = getErrorMessage(error)
        return makeResult({
          ok: false,
          error,
          code: 'unexpected_error',
        })
      }
    },

    async signOut() {
      if (!hasSupabaseConfig) {
        this.user = null
        this.error = supabaseConfigError
        this.initialized = true
        this.loading = false
        clearUserScopedState()
        return getConfigErrorResult()
      }

      this.error = null
      let signOutError = null

      try {
        const { error } = await supabase.auth.signOut()
        if (error && !getErrorMessage(error).toLowerCase().includes('session')) {
          signOutError = error
          this.error = error.message
        }
      } catch (error) {
        signOutError = error
        this.error = getErrorMessage(error)
      } finally {
        this.user = null
        this.lastAuthEvent = 'SIGNED_OUT'
        this.isRecoveryMode = false
        clearUserScopedState()
      }

      if (signOutError) {
        return makeResult({
          ok: false,
          error: signOutError,
          code: 'unexpected_error',
        })
      }

      return makeResult({
        ok: true,
        outcome: 'signed_out',
      })
    }
  },
})
