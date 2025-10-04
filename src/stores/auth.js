import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabaseClient'

export const useAuthStore = defineStore('auth', {
    state: () => ({
      user: null,
      loading: true,
      error: null,
    }),
    actions: {
      async init() {
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
        this.error = null
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) this.error = error.message
        return data
      },
      async signIn(email, password) {
        this.error = null
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) this.error = error.message
        return data
      },
      async signOut() {
        await supabase.auth.signOut()
      }
    }
  })