import { createClient } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
const authRedirectBaseUrl = import.meta.env.VITE_AUTH_REDIRECT_URL?.trim()
const nativeAuthRedirectScheme = import.meta.env.VITE_NATIVE_AUTH_REDIRECT_SCHEME?.trim() || 'com.adrianmiller.nutritrack'
const defaultHostedAuthRedirectBaseUrl = 'https://adrianmiller99.github.io/nutri-track'
const supportedAuthLocales = new Set(['en', 'de'])

export const missingSupabaseEnvVars = [
  !supabaseUrl && 'VITE_SUPABASE_URL',
  !supabaseAnonKey && 'VITE_SUPABASE_ANON_KEY',
].filter(Boolean)

export const hasSupabaseConfig = missingSupabaseEnvVars.length === 0

export const supabaseConfigError = hasSupabaseConfig
  ? null
  : `Missing required environment variables: ${missingSupabaseEnvVars.join(', ')}`

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export function getSupabaseEmailRedirectUrl() {
  if (supabaseEmailRedirectUrl) {
    return supabaseEmailRedirectUrl
  }

  if (typeof window === 'undefined') {
    return undefined
  }

  return new URL(import.meta.env.BASE_URL, window.location.origin).toString()
}

export function assertSupabaseConfig() {
  if (!hasSupabaseConfig) {
    throw new Error(`${supabaseConfigError}. Add them to a .env file and rebuild the app.`)
  }
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '')
}

function normalizeLocale(locale) {
  return supportedAuthLocales.has(locale) ? locale : 'en'
}

function normalizePath(path = '') {
  if (!path) {
    return ''
  }

  return path.startsWith('/') ? path : `/${path}`
}

function getUrlObject(urlString) {
  if (urlString) {
    return new URL(urlString)
  }

  if (typeof window === 'undefined') {
    return null
  }

  return new URL(window.location.href)
}

export function getAuthCallbackParams(urlString) {
  const url = getUrlObject(urlString)
  const params = new URLSearchParams(url?.search || '')
  const hashParams = new URLSearchParams(url?.hash?.replace(/^#/, '') || '')

  for (const [key, value] of hashParams.entries()) {
    params.set(key, value)
  }

  return params
}

export function hasRecoveryCallback(urlString) {
  const params = getAuthCallbackParams(urlString)
  return params.get('type') === 'recovery' || params.has('error_code')
}

export function getAuthSessionTokensFromUrl(urlString) {
  const params = getAuthCallbackParams(urlString)
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')

  if (!access_token || !refresh_token) {
    return null
  }

  return { access_token, refresh_token }
}

function getRuntimeAppBaseUrl() {
  if (typeof window === 'undefined') {
    return null
  }

  return `${window.location.origin}${import.meta.env.BASE_URL || '/'}`
}

export function getAuthRedirectBaseUrl() {
  const configuredBaseUrl = authRedirectBaseUrl
    || (import.meta.env.MODE === 'capacitor' ? defaultHostedAuthRedirectBaseUrl : null)
    || getRuntimeAppBaseUrl()
  if (!configuredBaseUrl) {
    return null
  }

  return trimTrailingSlash(configuredBaseUrl)
}

export function buildAuthRedirectUrl(locale = 'en', path = '') {
  const baseUrl = getAuthRedirectBaseUrl()
  if (!baseUrl) {
    return null
  }

  const normalizedLocale = normalizeLocale(locale || 'en')
  const normalizedPath = normalizePath(path)

  return `${baseUrl}/${normalizedLocale}${normalizedPath}`
}

export function buildNativeAuthRedirectUrl(locale = 'en', path = '') {
  const normalizedLocale = normalizeLocale(locale || 'en')
  const normalizedPath = normalizePath(path)
  return `${nativeAuthRedirectScheme}://${normalizedLocale}${normalizedPath}`
}

export function buildPasswordResetRedirectUrl(locale = 'en', { preferNative = Capacitor.isNativePlatform() } = {}) {
  return preferNative
    ? buildNativeAuthRedirectUrl(locale, '/auth/reset-password')
    : buildAuthRedirectUrl(locale, '/auth/reset-password')
}

export function parseNativeAuthRedirectUrl(urlString) {
  try {
    const url = getUrlObject(urlString)
    if (!url || url.protocol !== `${nativeAuthRedirectScheme}:`) {
      return null
    }

    const locale = normalizeLocale(url.hostname || url.host)
    const normalizedPath = normalizePath(url.pathname || '/')

    return {
      path: `/${locale}${normalizedPath}`,
      search: url.search || '',
      hash: url.hash || '',
      isRecoveryLink: hasRecoveryCallback(urlString),
    }
  } catch {
    return null
  }
}
