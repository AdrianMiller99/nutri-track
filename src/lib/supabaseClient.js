import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

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

export function assertSupabaseConfig() {
  if (!hasSupabaseConfig) {
    throw new Error(`${supabaseConfigError}. Add them to a .env file and rebuild the app.`)
  }
}
