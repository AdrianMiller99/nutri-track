import { defineStore } from 'pinia'
import { hasSupabaseConfig, supabase, supabaseConfigError } from '@/lib/supabaseClient'

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
          return null
        }

        this.error = null
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) this.error = error.message
        return data
      },
      async signIn(email, password) {
        if (!hasSupabaseConfig) {
          this.error = supabaseConfigError
          return null
        }

        this.error = null
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) this.error = error.message
        return data
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
