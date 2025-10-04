/**
 * Open Food Facts API Service
 * API Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
 * Terms: https://world.openfoodfacts.org/terms-of-use
 * 
 * Rate limit: ~100 requests/min is reasonable
 * Always attribute: "Data from Open Food Facts"
 */

const OFF_API_BASE = 'https://world.openfoodfacts.org'
const USER_AGENT = 'NutriTrack/0.1.0 (https://github.com/yourusername/nutri-track)' // Update with your info

/**
 * Normalize product data from Open Food Facts into our app format
 */
function normalizeProduct(offProduct) {
  if (!offProduct || !offProduct.code) return null

  const nutriments = offProduct.nutriments || {}
  const product_name = offProduct.product_name || offProduct.product_name_en || 'Unknown Product'
  const brands = offProduct.brands || ''
  
  return {
    code: offProduct.code,
    name: product_name,
    brand: brands,
    image_url: offProduct.image_url || offProduct.image_front_url || null,
    
    // Nutriments per 100g (OFF standard)
    nutriments: {
      energy_kcal: nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0,
      proteins: nutriments.proteins_100g || nutriments.proteins || 0,
      carbohydrates: nutriments.carbohydrates_100g || nutriments.carbohydrates || 0,
      fat: nutriments.fat_100g || nutriments.fat || 0,
      fiber: nutriments.fiber_100g || nutriments.fiber || 0,
      sugars: nutriments.sugars_100g || nutriments.sugars || 0,
      sodium: nutriments.sodium_100g || nutriments.sodium || 0,
      salt: nutriments.salt_100g || nutriments.salt || 0,
    },
    
    // Serving size info
    serving_size: offProduct.serving_size || null,
    serving_quantity: offProduct.serving_quantity || null,
    
    // Additional metadata
    categories: offProduct.categories || '',
    labels: offProduct.labels || '',
    nutriscore_grade: offProduct.nutriscore_grade || null,
    nova_group: offProduct.nova_group || null,
    
    // Track when we fetched it
    fetched_at: new Date().toISOString()
  }
}

/**
 * Search products by text query
 * @param {string} query - Search term
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Results per page
 * @returns {Promise<{products: Array, count: number, page: number}>}
 */
export async function searchProducts(query, page = 1, pageSize = 25) {
  if (!query || query.trim().length === 0) {
    throw new Error('Search query cannot be empty')
  }

  try {
    const params = new URLSearchParams({
      search_terms: query.trim(),
      page: page.toString(),
      page_size: pageSize.toString(),
      json: '1',
      fields: 'code,product_name,product_name_en,brands,image_url,image_front_url,nutriments,serving_size,serving_quantity,categories,labels,nutriscore_grade,nova_group'
    })

    const response = await fetch(`${OFF_API_BASE}/cgi/search.pl?${params}`, {
      headers: {
        'User-Agent': USER_AGENT
      }
    })

    if (!response.ok) {
      throw new Error(`OFF API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      products: (data.products || []).map(normalizeProduct).filter(p => p !== null),
      count: data.count || 0,
      page: data.page || page,
      pageSize: data.page_size || pageSize
    }
  } catch (error) {
    console.error('Error searching Open Food Facts:', error)
    throw error
  }
}

/**
 * Get product by barcode
 * @param {string} barcode - Product barcode/code
 * @returns {Promise<Object|null>} Normalized product or null if not found
 */
export async function getProductByBarcode(barcode) {
  if (!barcode) {
    throw new Error('Barcode cannot be empty')
  }

  try {
    const response = await fetch(`${OFF_API_BASE}/api/v2/product/${barcode}`, {
      headers: {
        'User-Agent': USER_AGENT
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null // Product not found
      }
      throw new Error(`OFF API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.status === 0 || !data.product) {
      return null // Product not found
    }

    return normalizeProduct(data.product)
  } catch (error) {
    console.error('Error fetching product from Open Food Facts:', error)
    throw error
  }
}

/**
 * Calculate nutrients for a specific serving size
 * @param {Object} product - Normalized product
 * @param {number} grams - Serving size in grams
 * @returns {Object} Calculated nutrients
 */
export function calculateNutrients(product, grams) {
  if (!product || !grams || grams <= 0) {
    return {
      energy_kcal: 0,
      proteins: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0,
      sugars: 0,
      sodium: 0,
      salt: 0
    }
  }

  const multiplier = grams / 100 // OFF data is per 100g
  const nutrients = {}

  for (const [key, value] of Object.entries(product.nutriments)) {
    nutrients[key] = Math.round((value * multiplier) * 100) / 100 // Round to 2 decimals
  }

  return nutrients
}

export default {
  searchProducts,
  getProductByBarcode,
  calculateNutrients,
  USER_AGENT
}

