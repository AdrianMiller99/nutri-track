<template>
  <div class="food-search">
    <!-- Animated Background -->
    <div class="background">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
    </div>

    <div class="search-content">
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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFoodStore } from '@/stores/food'
import { useDayStore } from '@/stores/day'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const foodStore = useFoodStore()
const dayStore = useDayStore()
const authStore = useAuthStore()

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

async function addToLog() {
  if (!authStore.user) {
    alert('Please log in to add foods to your diary')
    router.push('/auth')
    return
  }

  if (!selectedProduct.value || servingGrams.value <= 0) return

  try {
    await dayStore.addItem(
      selectedProduct.value,
      servingGrams.value,
      calculatedNutrients.value
    )
    
    alert(`✅ Added ${servingGrams.value}g of ${selectedProduct.value.name} to ${dayStore.isToday ? 'today' : dayStore.selectedDate}!`)
    closeModal()
    
    // Optionally redirect to dashboard
    // router.push('/app/dashboard')
  } catch (error) {
    alert('❌ Failed to add food: ' + error.message)
  }
}
</script>

<style scoped>
.food-search {
  min-height: 100vh;
  background: #0a0a0a;
  position: relative;
}

/* Animated Background */
.background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.4;
  animation: float 25s infinite ease-in-out;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: linear-gradient(45deg, #4facfe 0%, #00f2fe 100%);
  top: -250px;
  left: -250px;
}

.orb-2 {
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  bottom: -300px;
  right: -300px;
  animation-delay: -12s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(50px, -50px) scale(1.05);
  }
}

.search-content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.search-box, .barcode-box {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.5rem;
}

.search-input, .barcode-input {
  flex: 1;
  padding: 0.75rem;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  transition: all 0.2s;
}

.search-input::placeholder, .barcode-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.search-input:focus, .barcode-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: #667eea;
}

button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clear-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.cache-stats {
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
}

.loading, .error {
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.loading {
  background: rgba(33, 150, 243, 0.1);
  border: 1px solid rgba(33, 150, 243, 0.2);
  color: #4facfe;
}

.error {
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.2);
  color: #ff5252;
}

.results h2 {
  color: white;
  margin-bottom: 1.5rem;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.product-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.product-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}

.product-image {
  width: 100%;
  height: 150px;
  object-fit: contain;
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 0.5rem;
}

.product-info h3 {
  font-size: 1rem;
  margin: 0.5rem 0;
  color: white;
}

.brand {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  margin: 0.25rem 0;
}

.nutrients {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.75rem;
  margin-top: 0.5rem;
}

.nutrients span {
  background: rgba(102, 126, 234, 0.2);
  color: rgba(255, 255, 255, 0.9);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.serving-info {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.5rem;
}

/* Modal */
.modal {
  position: fixed;
  top: 50;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: rgba(15, 15, 15, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 1.5rem;
  padding: 0.5rem;
  width: 40px;
  height: 40px;
  line-height: 1;
  border-radius: 8px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.product-detail {
  text-align: center;
}

.product-detail h2 {
  color: white;
  margin: 1rem 0;
}

.detail-image {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  margin-bottom: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 1rem;
}

.barcode {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  font-family: monospace;
}

.serving-calculator {
  margin: 2rem 0;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  text-align: left;
}

.serving-calculator h3,
.serving-calculator h4 {
  color: white;
}

.serving-calculator label {
  display: block;
  margin: 1rem 0;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.serving-calculator input {
  width: 100%;
  padding: 0.75rem;
  margin-top: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 1rem;
  color: white;
  transition: all 0.2s;
}

.serving-calculator input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: #667eea;
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
  padding: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.calculated-nutrients td:first-child {
  font-weight: 500;
}

.calculated-nutrients td:last-child {
  text-align: right;
  color: white;
  font-weight: 600;
}

.product-meta {
  margin: 1rem 0;
  text-align: left;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

.product-meta p {
  margin: 0.75rem 0;
}

.product-meta strong {
  color: rgba(255, 255, 255, 0.9);
}

.add-btn {
  width: 100%;
  padding: 1.25rem;
  font-size: 1.1rem;
  margin-top: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.add-btn:hover {
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.attribution {
  margin-top: 1.5rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.attribution a {
  color: #667eea;
  text-decoration: none;
  transition: color 0.2s;
}

.attribution a:hover {
  color: #764ba2;
}
</style>

