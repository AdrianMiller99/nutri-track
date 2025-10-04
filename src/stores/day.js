import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from './auth'

/**
 * Store for managing daily food entries
 * Handles today's log, totals, and navigation between days
 */
export const useDayStore = defineStore('day', {
  state: () => ({
    // Current selected date (YYYY-MM-DD)
    selectedDate: (() => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    })(),
    
    // Current entry for selected date
    currentEntry: null,
    
    // Items logged for current entry
    items: [],
    
    // Loading states
    loading: false,
    itemsLoading: false,
    savingItem: false,
    
    // Errors
    error: null,
    
    // Calculated totals
    totals: {
      kcal: 0,
      protein_g: 0,
      carb_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sugar_g: 0,
      sodium_mg: 0
    }
  }),

  getters: {
    /**
     * Is the selected date today?
     */
    isToday: (state) => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const today = `${year}-${month}-${day}`
      return state.selectedDate === today
    },

    /**
     * Formatted date for display
     */
    displayDate: (state) => {
      const date = new Date(state.selectedDate + 'T00:00:00')
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    },

    /**
     * Number of items logged today
     */
    itemCount: (state) => state.items.length,

    /**
     * Has any items logged
     */
    hasItems: (state) => state.items.length > 0
  },

  actions: {
    /**
     * Load or create entry for selected date
     */
    async loadEntry() {
      const authStore = useAuthStore()
      if (!authStore.user) {
        this.error = 'User not authenticated'
        return
      }

      this.loading = true
      this.error = null

      try {
        // Try to fetch existing entry
        const { data: existingEntry, error: fetchError } = await supabase
          .from('entries')
          .select('*')
          .eq('user_id', authStore.user.id)
          .eq('date', this.selectedDate)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 = not found, which is okay
          throw fetchError
        }

        if (existingEntry) {
          this.currentEntry = existingEntry
        } else {
          // Create new entry for this date
          const { data: newEntry, error: createError } = await supabase
            .from('entries')
            .insert({
              user_id: authStore.user.id,
              date: this.selectedDate
            })
            .select()
            .single()

          if (createError) throw createError
          this.currentEntry = newEntry
        }

        // Load items for this entry
        await this.loadItems()

      } catch (error) {
        console.error('Error loading entry:', error)
        this.error = error.message
        this.currentEntry = null
        this.items = []
      } finally {
        this.loading = false
      }
    },

    /**
     * Load items for current entry
     */
    async loadItems() {
      if (!this.currentEntry) return

      this.itemsLoading = true

      try {
        const { data, error } = await supabase
          .from('entry_items')
          .select('*')
          .eq('entry_id', this.currentEntry.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        this.items = data || []
        this.calculateTotals()

      } catch (error) {
        console.error('Error loading items:', error)
        this.error = error.message
        this.items = []
      } finally {
        this.itemsLoading = false
      }
    },

    /**
     * Add a food item to today's log
     * @param {Object} product - Product from Open Food Facts
     * @param {number} servingGrams - Amount in grams
     * @param {Object} calculatedNutrients - Pre-calculated nutrients
     */
    async addItem(product, servingGrams, calculatedNutrients) {
      const authStore = useAuthStore()
      if (!authStore.user) {
        throw new Error('User not authenticated')
      }

      // Ensure we have an entry for selected date
      if (!this.currentEntry) {
        await this.loadEntry()
      }

      if (!this.currentEntry) {
        throw new Error('Failed to create entry')
      }

      this.savingItem = true
      this.error = null

      try {
        const itemData = {
          entry_id: this.currentEntry.id,
          product_code: product.code,
          label: product.name,
          brand: product.brand || null,
          image_url: product.image_url || null,
          serving_grams: servingGrams,
          quantity: 1,
          kcal: calculatedNutrients.energy_kcal || 0,
          protein_g: calculatedNutrients.proteins || 0,
          carb_g: calculatedNutrients.carbohydrates || 0,
          fat_g: calculatedNutrients.fat || 0,
          fiber_g: calculatedNutrients.fiber || 0,
          sugar_g: calculatedNutrients.sugars || 0,
          sodium_mg: (calculatedNutrients.sodium || 0) * 1000, // Convert g to mg
          meal_type: null // Can be added later
        }

        const { data, error } = await supabase
          .from('entry_items')
          .insert(itemData)
          .select()
          .single()

        if (error) throw error

        // Add to local state
        this.items.unshift(data)
        this.calculateTotals()

        console.log(`✅ Added ${product.name} (${servingGrams}g) to ${this.selectedDate}`)

      } catch (error) {
        console.error('Error adding item:', error)
        this.error = error.message
        throw error
      } finally {
        this.savingItem = false
      }
    },

    /**
     * Delete an item from the log
     */
    async deleteItem(itemId) {
      this.error = null

      try {
        const { error } = await supabase
          .from('entry_items')
          .delete()
          .eq('id', itemId)

        if (error) throw error

        // Remove from local state
        this.items = this.items.filter(item => item.id !== itemId)
        this.calculateTotals()

        console.log(`🗑️ Deleted item ${itemId}`)

      } catch (error) {
        console.error('Error deleting item:', error)
        this.error = error.message
        throw error
      }
    },

    /**
     * Update an item's serving size
     */
    async updateItemServing(itemId, newServingGrams) {
      this.error = null

      try {
        const item = this.items.find(i => i.id === itemId)
        if (!item) throw new Error('Item not found')

        // Recalculate nutrients based on new serving size
        const multiplier = newServingGrams / item.serving_grams
        
        const updates = {
          serving_grams: newServingGrams,
          kcal: Math.round((item.kcal * multiplier) * 100) / 100,
          protein_g: Math.round((item.protein_g * multiplier) * 100) / 100,
          carb_g: Math.round((item.carb_g * multiplier) * 100) / 100,
          fat_g: Math.round((item.fat_g * multiplier) * 100) / 100,
          fiber_g: Math.round((item.fiber_g * multiplier) * 100) / 100,
          sugar_g: Math.round((item.sugar_g * multiplier) * 100) / 100,
          sodium_mg: Math.round((item.sodium_mg * multiplier) * 100) / 100
        }

        const { error } = await supabase
          .from('entry_items')
          .update(updates)
          .eq('id', itemId)

        if (error) throw error

        // Update local state
        const index = this.items.findIndex(i => i.id === itemId)
        if (index !== -1) {
          this.items[index] = { ...this.items[index], ...updates }
        }
        this.calculateTotals()

        console.log(`✏️ Updated item ${itemId} to ${newServingGrams}g`)

      } catch (error) {
        console.error('Error updating item:', error)
        this.error = error.message
        throw error
      }
    },

    /**
     * Calculate totals from current items
     */
    calculateTotals() {
      this.totals = {
        kcal: 0,
        protein_g: 0,
        carb_g: 0,
        fat_g: 0,
        fiber_g: 0,
        sugar_g: 0,
        sodium_mg: 0
      }

      for (const item of this.items) {
        this.totals.kcal += item.kcal || 0
        this.totals.protein_g += item.protein_g || 0
        this.totals.carb_g += item.carb_g || 0
        this.totals.fat_g += item.fat_g || 0
        this.totals.fiber_g += item.fiber_g || 0
        this.totals.sugar_g += item.sugar_g || 0
        this.totals.sodium_mg += item.sodium_mg || 0
      }

      // Round to 1 decimal
      for (const key in this.totals) {
        this.totals[key] = Math.round(this.totals[key] * 10) / 10
      }
    },

    /**
     * Go to previous day
     */
    async previousDay() {
      const [year, month, day] = this.selectedDate.split('-').map(Number)
      const date = new Date(year, month - 1, day) // month is 0-indexed
      date.setDate(date.getDate() - 1)
      this.selectedDate = this.formatDate(date)
      await this.loadEntry()
    },

    /**
     * Go to next day
     */
    async nextDay() {
      const [year, month, day] = this.selectedDate.split('-').map(Number)
      const date = new Date(year, month - 1, day) // month is 0-indexed
      date.setDate(date.getDate() + 1)
      this.selectedDate = this.formatDate(date)
      await this.loadEntry()
    },

    /**
     * Go to today
     */
    async goToToday() {
      this.selectedDate = this.formatDate(new Date())
      await this.loadEntry()
    },

    /**
     * Format date as YYYY-MM-DD in local timezone
     */
    formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },

    /**
     * Set specific date
     */
    async setDate(dateString) {
      this.selectedDate = dateString
      await this.loadEntry()
    },

    /**
     * Clear state (on logout)
     */
    clearState() {
      this.selectedDate = this.formatDate(new Date())
      this.currentEntry = null
      this.items = []
      this.error = null
      this.totals = {
        kcal: 0,
        protein_g: 0,
        carb_g: 0,
        fat_g: 0,
        fiber_g: 0,
        sugar_g: 0,
        sodium_mg: 0
      }
    }
  }
})

