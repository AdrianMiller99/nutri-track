<template>
  <div class="food-search">
    <h1>Search Food</h1>
    
    <!-- Search Input -->
    <div class="search-box">
      <input
        v-model="query"
        @input="handleSearch"
        type="text"
        placeholder="Search for food (e.g., 'almond milk')"
        class="search-input"
      />
      <button v-if="query" @click="clearSearch" class="clear-btn">Clear</button>
    </div>

    <!-- Barcode Lookup -->
    <div class="barcode-box">
      <input
        v-model="barcode"
        type="text"
        placeholder="Or enter barcode"
        class="barcode-input"
      />
      <button @click="lookupBarcode" :disabled="!barcode">Lookup</button>
    </div>

    <!-- Cache Stats -->
    <div class="cache-stats">
      <small>
        Cache: {{ foodStore.cacheStats.hits }} hits, 
        {{ foodStore.cacheStats.misses }} misses 
        ({{ foodStore.cacheStats.hitRate }} hit rate)
      </small>
    </div>

    <!-- Loading State -->
    <div v-if="foodStore.searchLoading || foodStore.productLoading" class="loading">
      Searching...
    </div>

    <!-- Error State -->
    <div v-if="foodStore.searchError || foodStore.productError" class="error">
      {{ foodStore.searchError || foodStore.productError }}
    </div>

    <!-- Search Results -->
    <div v-if="foodStore.hasSearchResults" class="results">
      <h2>Results ({{ foodStore.searchResults.length }})</h2>
      <div class="product-grid">
        <div
          v-for="product in foodStore.searchResults"
          :key="product.code"
          class="product-card"
          @click="selectProduct(product)"
        >
          <img
            v-if="product.image_url"
            :src="product.image_url"
            :alt="product.name"
            class="product-image"
          />
          <div class="product-info">
            <h3>{{ product.name }}</h3>
            <p class="brand">{{ product.brand || 'Unknown brand' }}</p>
            <div class="nutrients">
              <span>{{ product.nutriments.energy_kcal }} kcal</span>
              <span>P: {{ product.nutriments.proteins }}g</span>
              <span>C: {{ product.nutriments.carbohydrates }}g</span>
              <span>F: {{ product.nutriments.fat }}g</span>
            </div>
            <p class="serving-info" v-if="product.serving_size">
              Serving: {{ product.serving_size }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Detail Modal -->
    <div v-if="selectedProduct" class="modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="close-btn" @click="closeModal">×</button>
        
        <div class="product-detail">
          <img
            v-if="selectedProduct.image_url"
            :src="selectedProduct.image_url"
            :alt="selectedProduct.name"
            class="detail-image"
          />
          
          <h2>{{ selectedProduct.name }}</h2>
          <p class="brand">{{ selectedProduct.brand }}</p>
          <p class="barcode">Barcode: {{ selectedProduct.code }}</p>

          <div class="serving-calculator">
            <h3>Calculate Nutrients</h3>
            <label>
              Serving size (grams):
              <input
                v-model.number="servingGrams"
                type="number"
                min="1"
                step="1"
              />
            </label>

            <div class="calculated-nutrients">
              <h4>Nutrients for {{ servingGrams }}g:</h4>
              <table>
                <tr>
                  <td>Energy</td>
                  <td>{{ calculatedNutrients.energy_kcal }} kcal</td>
                </tr>
                <tr>
                  <td>Protein</td>
                  <td>{{ calculatedNutrients.proteins }} g</td>
                </tr>
                <tr>
                  <td>Carbohydrates</td>
                  <td>{{ calculatedNutrients.carbohydrates }} g</td>
                </tr>
                <tr>
                  <td>Fat</td>
                  <td>{{ calculatedNutrients.fat }} g</td>
                </tr>
                <tr>
                  <td>Fiber</td>
                  <td>{{ calculatedNutrients.fiber }} g</td>
                </tr>
                <tr>
                  <td>Sugars</td>
                  <td>{{ calculatedNutrients.sugars }} g</td>
                </tr>
              </table>
            </div>
          </div>

          <div class="product-meta">
            <p v-if="selectedProduct.categories">
              <strong>Categories:</strong> {{ selectedProduct.categories }}
            </p>
            <p v-if="selectedProduct.nutriscore_grade">
              <strong>Nutri-Score:</strong> {{ selectedProduct.nutriscore_grade.toUpperCase() }}
            </p>
            <p v-if="selectedProduct.nova_group">
              <strong>NOVA Group:</strong> {{ selectedProduct.nova_group }} (processing level)
            </p>
          </div>

          <button class="add-btn" @click="addToLog">
            Add {{ servingGrams }}g to Today
          </button>

          <p class="attribution">
            Data from <a href="https://openfoodfacts.org" target="_blank">Open Food Facts</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useFoodStore } from '@/stores/food'

const foodStore = useFoodStore()

const query = ref('')
const barcode = ref('')
const selectedProduct = ref(null)
const servingGrams = ref(100)

// Debounce search
let searchTimeout = null
function handleSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    if (query.value.trim()) {
      foodStore.search(query.value)
    } else {
      foodStore.clearSearch()
    }
  }, 300)
}

function clearSearch() {
  query.value = ''
  foodStore.clearSearch()
}

async function lookupBarcode() {
  if (!barcode.value) return
  
  const product = await foodStore.getProduct(barcode.value)
  if (product) {
    selectedProduct.value = product
  }
}

function selectProduct(product) {
  selectedProduct.value = product
  servingGrams.value = product.serving_quantity || 100
}

function closeModal() {
  selectedProduct.value = null
}

const calculatedNutrients = computed(() => {
  if (!selectedProduct.value) return {}
  return foodStore.calculateServingNutrients(selectedProduct.value, servingGrams.value)
})

function addToLog() {
  // TODO: Implement adding to user's daily log
  // This would use a separate store (useDayStore) to add the entry
  alert(`Added ${servingGrams.value}g of ${selectedProduct.value.name} to today!`)
  closeModal()
}
</script>

<style scoped>
.food-search {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.search-box, .barcode-box {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.search-input, .barcode-input {
  flex: 1;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
}

.search-input:focus, .barcode-input:focus {
  outline: none;
  border-color: #4CAF50;
}

button {
  padding: 0.75rem 1.5rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}

button:hover:not(:disabled) {
  background: #45a049;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.clear-btn {
  background: #f44336;
}

.cache-stats {
  margin-bottom: 1rem;
  color: #666;
}

.loading, .error {
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 8px;
}

.loading {
  background: #e3f2fd;
  color: #1976d2;
}

.error {
  background: #ffebee;
  color: #c62828;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.product-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.product-image {
  width: 100%;
  height: 150px;
  object-fit: contain;
  margin-bottom: 0.5rem;
}

.product-info h3 {
  font-size: 1rem;
  margin: 0.5rem 0;
  color: #333;
}

.brand {
  color: #666;
  font-size: 0.875rem;
  margin: 0.25rem 0;
}

.nutrients {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.75rem;
  color: #888;
  margin-top: 0.5rem;
}

.nutrients span {
  background: #f5f5f5;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.serving-info {
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.5rem;
}

/* Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  padding: 2rem;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  color: #666;
  font-size: 2rem;
  padding: 0;
  width: 40px;
  height: 40px;
  line-height: 1;
}

.product-detail {
  text-align: center;
}

.detail-image {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  margin-bottom: 1rem;
}

.barcode {
  color: #666;
  font-size: 0.875rem;
  font-family: monospace;
}

.serving-calculator {
  margin: 2rem 0;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
  text-align: left;
}

.serving-calculator label {
  display: block;
  margin: 1rem 0;
}

.serving-calculator input {
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.calculated-nutrients {
  margin-top: 1rem;
}

.calculated-nutrients table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
}

.calculated-nutrients td {
  padding: 0.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.calculated-nutrients td:first-child {
  font-weight: 500;
}

.calculated-nutrients td:last-child {
  text-align: right;
}

.product-meta {
  margin: 1rem 0;
  text-align: left;
  font-size: 0.875rem;
}

.product-meta p {
  margin: 0.5rem 0;
}

.add-btn {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  margin-top: 1rem;
}

.attribution {
  margin-top: 1rem;
  font-size: 0.75rem;
  color: #666;
}

.attribution a {
  color: #4CAF50;
  text-decoration: none;
}
</style>

