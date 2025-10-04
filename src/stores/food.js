import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabaseClient'
import { searchProducts, getProductByBarcode, calculateNutrients } from '@/services/openFoodFacts'

// Cache validity period (7 days)
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export const useFoodStore = defineStore('food', {
  state: () => ({
    // Search state
    searchQuery: '',
    searchResults: [],
    searchLoading: false,
    searchError: null,
    
    // Product detail state
    currentProduct: null,
    productLoading: false,
    productError: null,
    
    // Cache stats (for debugging/monitoring)
    cacheHits: 0,
    cacheMisses: 0
  }),

  actions: {
    /**
     * Search for products by text query
     * Uses cache-first strategy
     */
    async search(query, page = 1, pageSize = 25) {
      if (!query || query.trim().length === 0) {
        this.searchResults = []
        this.searchQuery = ''
        return
      }

      this.searchQuery = query
      this.searchLoading = true
      this.searchError = null

      try {
        // Try to search in cache first (using full-text search)
        const cachedResults = await this._searchCache(query, pageSize)
        
        if (cachedResults.length > 0) {
          this.searchResults = cachedResults
          this.cacheHits++
          console.log(`[Cache HIT] Found ${cachedResults.length} results in cache for "${query}"`)
        } else {
          // Cache miss - fetch from API
          this.cacheMisses++
          console.log(`[Cache MISS] Fetching from API for "${query}"`)
          
          const apiResults = await searchProducts(query, page, pageSize)
          this.searchResults = apiResults.products
          
          // Cache all results in background (don't await)
          this._cacheProducts(apiResults.products).catch(err => {
            console.warn('Failed to cache search results:', err)
          })
        }
      } catch (error) {
        console.error('Search error:', error)
        this.searchError = error.message
        this.searchResults = []
      } finally {
        this.searchLoading = false
      }
    },

    /**
     * Get product by barcode
     * Cache-first strategy with staleness check
     */
    async getProduct(barcode) {
      if (!barcode) {
        throw new Error('Barcode is required')
      }

      this.productLoading = true
      this.productError = null
      this.currentProduct = null

      try {
        // Check cache first
        const cached = await this._getCachedProduct(barcode)
        
        if (cached && this._isCacheFresh(cached.fetched_at)) {
          // Cache hit and fresh
          this.currentProduct = cached
          this.cacheHits++
          console.log(`[Cache HIT] Product ${barcode} from cache`)
          return cached
        }

        // Cache miss or stale - fetch from API
        this.cacheMisses++
        console.log(`[Cache ${cached ? 'STALE' : 'MISS'}] Fetching product ${barcode} from API`)
        
        const product = await getProductByBarcode(barcode)
        
        if (!product) {
          this.productError = 'Product not found'
          return null
        }

        this.currentProduct = product

        // Update cache in background
        if (cached) {
          this._updateCache(product).catch(err => {
            console.warn('Failed to update cache:', err)
          })
        } else {
          this._cacheProducts([product]).catch(err => {
            console.warn('Failed to cache product:', err)
          })
        }

        return product
      } catch (error) {
        console.error('Get product error:', error)
        this.productError = error.message
        this.currentProduct = null
        return null
      } finally {
        this.productLoading = false
      }
    },

    /**
     * Calculate nutrients for a serving
     */
    calculateServingNutrients(product, grams) {
      return calculateNutrients(product, grams)
    },

    /**
     * Clear search results
     */
    clearSearch() {
      this.searchQuery = ''
      this.searchResults = []
      this.searchError = null
    },

    /**
     * Clear current product
     */
    clearProduct() {
      this.currentProduct = null
      this.productError = null
    },

    // ===== PRIVATE CACHE METHODS =====

    /**
     * Search in local Supabase cache using full-text search
     */
    async _searchCache(query, limit = 25) {
      try {
        const { data, error } = await supabase
          .from('products_cache')
          .select('*')
          .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
          .limit(limit)

        if (error) throw error
        
        return (data || []).map(this._dbToProduct)
      } catch (error) {
        console.warn('Cache search failed:', error)
        return []
      }
    },

    /**
     * Get a single product from cache by barcode
     */
    async _getCachedProduct(barcode) {
      try {
        const { data, error } = await supabase
          .from('products_cache')
          .select('*')
          .eq('code', barcode)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            // Not found
            return null
          }
          throw error
        }

        return this._dbToProduct(data)
      } catch (error) {
        console.warn('Cache lookup failed:', error)
        return null
      }
    },

    /**
     * Cache multiple products
     */
    async _cacheProducts(products) {
      if (!products || products.length === 0) return

      const records = products.map(p => ({
        code: p.code,
        name: p.name,
        brand: p.brand,
        image_url: p.image_url,
        nutriments: p.nutriments,
        serving_size: p.serving_size,
        serving_quantity: p.serving_quantity,
        categories: p.categories,
        labels: p.labels,
        nutriscore_grade: p.nutriscore_grade,
        nova_group: p.nova_group,
        fetched_at: p.fetched_at
      }))

      const { error } = await supabase
        .from('products_cache')
        .upsert(records, { 
          onConflict: 'code',
          ignoreDuplicates: false 
        })

      if (error) {
        console.error('Failed to cache products:', error)
        throw error
      }

      console.log(`[Cache] Stored ${records.length} product(s)`)
    },

    /**
     * Update a single cached product
     */
    async _updateCache(product) {
      const { error } = await supabase
        .from('products_cache')
        .update({
          name: product.name,
          brand: product.brand,
          image_url: product.image_url,
          nutriments: product.nutriments,
          serving_size: product.serving_size,
          serving_quantity: product.serving_quantity,
          categories: product.categories,
          labels: product.labels,
          nutriscore_grade: product.nutriscore_grade,
          nova_group: product.nova_group,
          fetched_at: product.fetched_at
        })
        .eq('code', product.code)

      if (error) {
        console.error('Failed to update cache:', error)
        throw error
      }

      console.log(`[Cache] Updated product ${product.code}`)
    },

    /**
     * Check if cached data is still fresh
     */
    _isCacheFresh(fetchedAt) {
      if (!fetchedAt) return false
      const age = Date.now() - new Date(fetchedAt).getTime()
      return age < CACHE_MAX_AGE_MS
    },

    /**
     * Convert database record to product format
     */
    _dbToProduct(dbRecord) {
      return {
        code: dbRecord.code,
        name: dbRecord.name,
        brand: dbRecord.brand,
        image_url: dbRecord.image_url,
        nutriments: dbRecord.nutriments,
        serving_size: dbRecord.serving_size,
        serving_quantity: dbRecord.serving_quantity,
        categories: dbRecord.categories,
        labels: dbRecord.labels,
        nutriscore_grade: dbRecord.nutriscore_grade,
        nova_group: dbRecord.nova_group,
        fetched_at: dbRecord.fetched_at
      }
    }
  },

  getters: {
    /**
     * Check if we have search results
     */
    hasSearchResults: (state) => state.searchResults.length > 0,

    /**
     * Get cache statistics
     */
    cacheStats: (state) => {
      const total = state.cacheHits + state.cacheMisses
      const hitRate = total > 0 ? (state.cacheHits / total * 100).toFixed(1) : 0
      return {
        hits: state.cacheHits,
        misses: state.cacheMisses,
        total,
        hitRate: `${hitRate}%`
      }
    }
  }
})

