# Open Food Facts Integration

This document explains how to use the Open Food Facts API integration with smart caching in Nutri Track.

## Overview

The integration uses a **cache-first strategy** to minimize API calls and enable offline functionality:

1. **Check Supabase cache** first (instant, works offline)
2. **Fetch from Open Food Facts API** if not cached or stale
3. **Store in Supabase** for future use

Cache entries expire after **7 days** and are automatically refreshed.

## Setup

### 1. Run the Supabase Migration

You need to create the `products_cache` table in your Supabase database:

```bash
# If using Supabase CLI (recommended)
supabase db push

# Or manually run the SQL in Supabase Dashboard
# Copy the contents of supabase/migrations/001_create_products_cache.sql
# and run it in the SQL Editor at: https://app.supabase.com/project/YOUR_PROJECT/sql
```

### 2. Update User-Agent (Optional but Recommended)

Edit `src/services/openFoodFacts.js` and update the `USER_AGENT` string:

```javascript
const USER_AGENT = 'NutriTrack/0.1.0 (https://github.com/YOUR_USERNAME/nutri-track)'
```

This helps Open Food Facts track usage and contact you if needed.

## Usage Examples

### Basic Search

```vue
<script setup>
import { useFoodStore } from '@/stores/food'

const foodStore = useFoodStore()

// Search for products
async function searchFood() {
  await foodStore.search('almond milk')
  // Results are in foodStore.searchResults
}
</script>

<template>
  <div>
    <input v-model="query" @input="searchFood" placeholder="Search foods..." />
    
    <div v-if="foodStore.searchLoading">Searching...</div>
    
    <div v-for="product in foodStore.searchResults" :key="product.code">
      <h3>{{ product.name }}</h3>
      <p>{{ product.brand }}</p>
      <img :src="product.image_url" :alt="product.name" />
    </div>
  </div>
</template>
```

### Barcode Lookup

```vue
<script setup>
import { useFoodStore } from '@/stores/food'
import { ref } from 'vue'

const foodStore = useFoodStore()
const barcode = ref('')

async function lookupBarcode() {
  const product = await foodStore.getProduct(barcode.value)
  
  if (product) {
    console.log('Found:', product.name)
    // Product is also available in foodStore.currentProduct
  } else {
    console.log('Product not found in database')
  }
}
</script>

<template>
  <div>
    <input v-model="barcode" placeholder="Enter barcode" />
    <button @click="lookupBarcode">Search</button>
    
    <div v-if="foodStore.currentProduct">
      <h2>{{ foodStore.currentProduct.name }}</h2>
      <p>{{ foodStore.currentProduct.brand }}</p>
      
      <h3>Nutrients (per 100g)</h3>
      <ul>
        <li>Energy: {{ foodStore.currentProduct.nutriments.energy_kcal }} kcal</li>
        <li>Protein: {{ foodStore.currentProduct.nutriments.proteins }} g</li>
        <li>Carbs: {{ foodStore.currentProduct.nutriments.carbohydrates }} g</li>
        <li>Fat: {{ foodStore.currentProduct.nutriments.fat }} g</li>
      </ul>
    </div>
  </div>
</template>
```

### Calculate Serving Nutrients

```vue
<script setup>
import { useFoodStore } from '@/stores/food'
import { ref, computed } from 'vue'

const foodStore = useFoodStore()
const servingGrams = ref(200)

// Get product first
await foodStore.getProduct('3017620422003') // Example barcode

// Calculate nutrients for specific serving size
const servingNutrients = computed(() => {
  if (!foodStore.currentProduct) return null
  return foodStore.calculateServingNutrients(
    foodStore.currentProduct, 
    servingGrams.value
  )
})
</script>

<template>
  <div>
    <label>
      Serving size (g):
      <input type="number" v-model.number="servingGrams" />
    </label>
    
    <div v-if="servingNutrients">
      <h3>Nutrients for {{ servingGrams }}g</h3>
      <ul>
        <li>Energy: {{ servingNutrients.energy_kcal }} kcal</li>
        <li>Protein: {{ servingNutrients.proteins }} g</li>
        <li>Carbs: {{ servingNutrients.carbohydrates }} g</li>
        <li>Fat: {{ servingNutrients.fat }} g</li>
      </ul>
    </div>
  </div>
</template>
```

### Store API Reference

#### State

```javascript
{
  searchQuery: '',          // Current search query
  searchResults: [],        // Array of products from search
  searchLoading: false,     // Search in progress
  searchError: null,        // Search error message
  
  currentProduct: null,     // Currently viewed product
  productLoading: false,    // Product fetch in progress
  productError: null,       // Product error message
  
  cacheHits: 0,            // Cache performance stats
  cacheMisses: 0
}
```

#### Actions

- **`search(query, page = 1, pageSize = 25)`**  
  Search for products by text. Results stored in `searchResults`.

- **`getProduct(barcode)`**  
  Get product by barcode. Returns product object and stores in `currentProduct`.

- **`calculateServingNutrients(product, grams)`**  
  Calculate nutrients for a specific serving size in grams.

- **`clearSearch()`**  
  Clear search results and query.

- **`clearProduct()`**  
  Clear current product.

#### Getters

- **`hasSearchResults`**  
  Boolean indicating if there are search results.

- **`cacheStats`**  
  Object with cache statistics: `{ hits, misses, total, hitRate }`.

## Product Data Structure

```javascript
{
  code: '3017620422003',              // Barcode
  name: 'Nutella',                    // Product name
  brand: 'Ferrero',                   // Brand
  image_url: 'https://...',           // Product image
  
  // All per 100g
  nutriments: {
    energy_kcal: 539,
    proteins: 6.3,
    carbohydrates: 57.5,
    fat: 30.9,
    fiber: 0,
    sugars: 56.3,
    sodium: 0.107,
    salt: 0.107
  },
  
  serving_size: '15g',                // Text description
  serving_quantity: 15,               // Numeric value
  
  categories: 'Spreads, Sweet spreads, ...', 
  labels: 'No gluten, ...',
  nutriscore_grade: 'e',              // a-e rating
  nova_group: 4,                      // 1-4 processing level
  
  fetched_at: '2024-10-03T12:00:00Z'  // Cache timestamp
}
```

## Cache Behavior

- **Cache Duration**: 7 days
- **Cache Strategy**: Cache-first with staleness check
- **Search**: Searches cache first using name/brand, falls back to API
- **Barcode**: Checks cache first, refetches if > 7 days old
- **Automatic Updates**: Stale cache entries are refreshed in background

## Attribution

When displaying product data, please include:

```
Data from Open Food Facts (https://openfoodfacts.org)
```

This is required by their terms of use.

## Rate Limits

Open Food Facts suggests staying under **100 requests/minute**. Our caching strategy should keep you well below this limit for normal usage.

## Monitoring Cache Performance

```vue
<script setup>
import { useFoodStore } from '@/stores/food'

const foodStore = useFoodStore()

// Check cache statistics
console.log(foodStore.cacheStats)
// { hits: 45, misses: 12, total: 57, hitRate: '78.9%' }
</script>
```

## Offline Support

Once products are cached in Supabase, they work offline (assuming your Supabase client has offline support or you implement a local cache layer).

## Troubleshooting

### "Products not found in cache"

This is normal for first-time searches. The cache builds up as users search.

### "API rate limit exceeded"

If you hit rate limits, implement request throttling or increase cache duration.

### "Supabase connection error"

Ensure your Supabase credentials are correct in `.env`:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## API Documentation

- **Open Food Facts API**: https://openfoodfacts.github.io/openfoodfacts-server/api/
- **Terms of Use**: https://world.openfoodfacts.org/terms-of-use
- **Data Fields**: https://world.openfoodfacts.org/data/data-fields.txt

