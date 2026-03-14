import { defineStore } from 'pinia'
import {
  getSupabaseEmailRedirectUrl,
  hasSupabaseConfig,
  supabase,
  supabaseConfigError,
} from '@/lib/supabaseClient'

export const useAuthStore = defineStore('auth', {
    state: () => ({
      user: null,
      loading: true,
      error: null,
    }),
    actions: {
      async init() {
        if (!hasSupabaseConfig) {
          this.error = supabaseConfigError
          this.loading = false
          return
        }

        // restore session on refresh
        const { data: { session } } = await supabase.auth.getSession()
        this.user = session?.user ?? null
        this.loading = false
  
        // listen to future changes
        supabase.auth.onAuthStateChange((_event, session) => {
          this.user = session?.user ?? null
        })
      },
      async signUp(email, password) {
        if (!hasSupabaseConfig) {
          this.error = supabaseConfigError
          return { data: null, error: new Error(supabaseConfigError) }
        }

        this.error = null
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getSupabaseEmailRedirectUrl(),
          },
        })
        if (error) this.error = error.message
        return { data, error }
      },
      async signIn(email, password) {
        if (!hasSupabaseConfig) {
          this.error = supabaseConfigError
          return { data: null, error: new Error(supabaseConfigError) }
        }

        this.error = null
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) this.error = error.message
        return { data, error }
      },
      async signOut() {
        if (!hasSupabaseConfig) {
          this.user = null
          this.error = supabaseConfigError
          return
        }

        await supabase.auth.signOut()
      }
    }
  })
