import { defineStore } from 'pinia'

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function nowIso() {
  return new Date().toISOString()
}

function getStorageKey(userId) {
  return `nutri-track:lists:${userId}`
}

function readListsFromStorage(userId) {
  if (typeof window === 'undefined' || !userId) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId))
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.warn('Failed to read saved lists from storage:', error)
    return []
  }
}

function writeListsToStorage(userId, lists) {
  if (typeof window === 'undefined' || !userId) {
    return
  }

  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(lists))
}

function buildListItem(product, servingGrams, calculatedNutrients) {
  return {
    id: makeId(),
    product_code: product.code,
    label: product.name,
    brand: product.brand || null,
    image_url: product.image_url || null,
    serving_grams: servingGrams,
    kcal: calculatedNutrients.energy_kcal || 0,
    protein_g: calculatedNutrients.proteins || 0,
    carb_g: calculatedNutrients.carbohydrates || 0,
    fat_g: calculatedNutrients.fat || 0,
    fiber_g: calculatedNutrients.fiber || 0,
    sugar_g: calculatedNutrients.sugars || 0,
    sodium_mg: (calculatedNutrients.sodium || 0) * 1000,
    added_at: nowIso(),
  }
}

export const useListsStore = defineStore('lists', {
  state: () => ({
    userId: null,
    lists: [],
    loading: false,
    error: null,
  }),

  getters: {
    hasLists: (state) => state.lists.length > 0,
    getListById: (state) => (listId) => state.lists.find((list) => list.id === listId) || null,
  },

  actions: {
    syncWithUser(userId) {
      if (!userId) {
        this.clearState()
        return
      }

      if (this.userId === userId) {
        return
      }

      this.loading = true
      this.error = null
      this.userId = userId
      this.lists = readListsFromStorage(userId)
      this.loading = false
    },

    persist() {
      if (!this.userId) {
        return
      }

      writeListsToStorage(this.userId, this.lists)
    },

    createList(name) {
      const trimmedName = name?.trim()
      if (!trimmedName) {
        throw new Error('List name is required')
      }

      const list = {
        id: makeId(),
        name: trimmedName,
        items: [],
        created_at: nowIso(),
        updated_at: nowIso(),
      }

      this.lists.unshift(list)
      this.persist()
      return list
    },

    deleteList(listId) {
      this.lists = this.lists.filter((list) => list.id !== listId)
      this.persist()
    },

    addItemToList(listId, product, servingGrams, calculatedNutrients) {
      const listIndex = this.lists.findIndex((list) => list.id === listId)
      if (listIndex === -1) {
        throw new Error('List not found')
      }

      if (!product) {
        throw new Error('Product is required')
      }

      if (!servingGrams || servingGrams <= 0) {
        throw new Error('Serving size must be greater than 0')
      }

      const item = buildListItem(product, servingGrams, calculatedNutrients)
      const list = this.lists[listIndex]

      this.lists[listIndex] = {
        ...list,
        items: [item, ...(list.items || [])],
        updated_at: nowIso(),
      }

      this.persist()
      return item
    },

    removeItemFromList(listId, itemId) {
      const listIndex = this.lists.findIndex((list) => list.id === listId)
      if (listIndex === -1) {
        throw new Error('List not found')
      }

      const list = this.lists[listIndex]
      this.lists[listIndex] = {
        ...list,
        items: (list.items || []).filter((item) => item.id !== itemId),
        updated_at: nowIso(),
      }

      this.persist()
    },

    clearState() {
      this.userId = null
      this.lists = []
      this.loading = false
      this.error = null
    },
  },
})
