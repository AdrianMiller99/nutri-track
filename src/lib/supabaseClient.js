import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
const authRedirectBaseUrl = import.meta.env.VITE_AUTH_REDIRECT_URL?.trim()
const defaultHostedAuthRedirectBaseUrl = 'https://adrianmiller99.github.io/nutri-track'

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

  const normalizedLocale = locale || 'en'
  const normalizedPath = path
    ? path.startsWith('/') ? path : `/${path}`
    : ''

  return `${baseUrl}/${normalizedLocale}${normalizedPath}`
}
