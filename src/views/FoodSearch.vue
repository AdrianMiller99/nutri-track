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
      <div class="input-with-icon">
        <input
          v-model="query"
          @input="handleSearch"
          type="text"
          placeholder="Search for food (e.g., 'almond milk')"
          class="search-input"
        />
        <button v-if="query" @click="clearSearch" class="clear-icon-btn" title="Clear search">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- Barcode Lookup -->
    <div v-if="isMobile" class="barcode-box mobile">
      <button @click="scanBarcode" class="scan-btn" :disabled="scanning">
        <svg v-if="!scanning" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
          <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
          <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
          <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
          <line x1="10" y1="8" x2="10" y2="16"></line>
          <line x1="14" y1="8" x2="14" y2="16"></line>
          <line x1="7" y1="12" x2="17" y2="12"></line>
        </svg>
        {{ scanning ? 'Scanning...' : 'Scan Barcode' }}
      </button>
    </div>
    <div v-else class="barcode-box desktop">
      <div class="input-with-icon">
        <input
          v-model="barcode"
          type="text"
          placeholder="Or enter barcode"
          class="barcode-input"
          @keyup.enter="lookupBarcode"
        />
        <button @click="scanBarcode" class="camera-icon-btn" :disabled="scanning" title="Scan barcode">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
        </button>
      </div>
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
      <h2>
        Results 
        <span v-if="foodStore.searchTotalCount > 0">
          ({{ foodStore.searchResults.length }} of {{ foodStore.searchTotalCount }})
        </span>
        <span v-else>
          ({{ foodStore.searchResults.length }})
        </span>
      </h2>
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

      <!-- Loading More Indicator -->
      <div v-if="foodStore.searchLoadingMore" class="loading-more">
        <div class="spinner"></div>
        <p>Loading more products...</p>
      </div>

      <!-- End of Results -->
      <div v-else-if="!foodStore.searchHasMore" class="end-of-results">
        <p>✓ You've reached the end of the results</p>
      </div>

      <!-- Scroll Trigger (invisible element to detect when near bottom) -->
      <div ref="scrollTrigger" class="scroll-trigger"></div>
    </div>

    <!-- Browser Barcode Scanner Modal -->
    <div v-if="showBrowserScanner" class="scanner-modal">
      <div class="scanner-container">
        <div class="scanner-header">
          <h2>Scan Barcode</h2>
          <button @click="stopBrowserScanner" class="scanner-close-btn">×</button>
        </div>
        <div id="qr-reader"></div>
        <p class="scanner-instructions">
          📷 Hold barcode steady within the frame<br>
          <small>Supports EAN-13, UPC, Code-128, QR codes, and more</small>
        </p>
        
        <!-- Manual entry fallback -->
        <div class="scanner-manual">
          <p class="scanner-or">OR</p>
          <div class="scanner-input-group">
            <input
              v-model="manualBarcode"
              type="text"
              placeholder="Enter barcode manually"
              class="scanner-manual-input"
              @keyup.enter="handleManualBarcode"
            />
            <button @click="handleManualBarcode" :disabled="!manualBarcode" class="scanner-manual-btn">
              Lookup
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Detail Modal -->
    <div 
      v-if="selectedProduct" 
      class="modal" 
      @click="closeModal"
      :style="{ paddingTop: navbarHeight + 'px' }"
    >
      <div 
        class="modal-content" 
        @click.stop
        :style="{ maxHeight: `calc(100vh - ${navbarHeight}px - 2rem)` }"
      >
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
                <tbody>
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
                </tbody>
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useFoodStore } from '@/stores/food'
import { useDayStore } from '@/stores/day'
import { useAuthStore } from '@/stores/auth'
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning'
import { Capacitor } from '@capacitor/core'
import Quagga from '@ericblade/quagga2'

const router = useRouter()
const foodStore = useFoodStore()
const dayStore = useDayStore()
const authStore = useAuthStore()

const query = ref('')
const barcode = ref('')
const selectedProduct = ref(null)
const servingGrams = ref(100)
const scanning = ref(false)
const isMobile = ref(false)
const scrollTrigger = ref(null)
const navbarHeight = ref(0)
const showBrowserScanner = ref(false)
const manualBarcode = ref('')

let intersectionObserver = null
let quaggaInitialized = false

// Detect if we're on a mobile platform and measure navbar height
onMounted(() => {
  isMobile.value = Capacitor.isNativePlatform() || window.innerWidth <= 768
  measureNavbarHeight()
  
  // Update navbar height on window resize
  window.addEventListener('resize', measureNavbarHeight)
})

onUnmounted(() => {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }
  window.removeEventListener('resize', measureNavbarHeight)
  
  // Clean up browser scanner if active
  if (quaggaInitialized) {
    stopBrowserScanner()
  }
})

// Measure the navbar height dynamically
function measureNavbarHeight() {
  const navbar = document.querySelector('.navbar')
  if (navbar) {
    navbarHeight.value = navbar.offsetHeight
  } else {
    navbarHeight.value = 0
  }
  console.log('[Modal] Navbar height:', navbarHeight.value + 'px')
}

// Watch for search results and setup infinite scroll when they appear
watch(() => foodStore.hasSearchResults, (hasResults) => {
  if (hasResults) {
    nextTick(() => {
      setupInfiniteScroll()
    })
  } else {
    // Clean up observer when results disappear
    if (intersectionObserver) {
      intersectionObserver.disconnect()
      intersectionObserver = null
    }
  }
})

// Setup infinite scroll using Intersection Observer
function setupInfiniteScroll() {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }

  if (!scrollTrigger.value) {
    console.warn('[Infinite Scroll] Scroll trigger element not found')
    return
  }

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      const firstEntry = entries[0]
      if (firstEntry.isIntersecting && foodStore.searchHasMore && !foodStore.searchLoadingMore) {
        console.log('[Infinite Scroll] Trigger visible, loading more...')
        loadMoreResults()
      }
    },
    {
      root: null,
      rootMargin: '200px', // Start loading 200px before reaching the trigger
      threshold: 0.1
    }
  )

  intersectionObserver.observe(scrollTrigger.value)
  console.log('[Infinite Scroll] Observer attached to scroll trigger')
}

async function loadMoreResults() {
  if (!foodStore.searchQuery || foodStore.searchLoadingMore || !foodStore.searchHasMore) {
    return
  }
  
  console.log('[Infinite Scroll] Loading more results...')
  await foodStore.loadMore()
}

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

async function scanBarcode() {
  scanning.value = true

  // Use native scanner on native platforms
  if (Capacitor.isNativePlatform()) {
    await scanBarcodeNative()
  } else {
    // Use browser-based scanner
    await scanBarcodeBrowser()
  }
}

async function scanBarcodeNative() {
  try {
    // Check and request camera permissions
    const { camera } = await BarcodeScanner.checkPermissions()
    
    if (camera === 'denied') {
      alert('Camera permission is required to scan barcodes. Please enable it in your device settings.')
      scanning.value = false
      return
    }

    if (camera !== 'granted') {
      const { camera: newPermission } = await BarcodeScanner.requestPermissions()
      if (newPermission !== 'granted') {
        alert('Camera permission was not granted.')
        scanning.value = false
        return
      }
    }

    // Hide the web content to make the camera visible
    document.querySelector('body')?.classList.add('barcode-scanner-active')

    // Start scanning
    const result = await BarcodeScanner.scan()
    
    // Show the web content again
    document.querySelector('body')?.classList.remove('barcode-scanner-active')

    if (result.barcodes && result.barcodes.length > 0) {
      const scannedBarcode = result.barcodes[0].rawValue
      await handleScannedBarcode(scannedBarcode)
    }
  } catch (error) {
    console.error('Native barcode scanning error:', error)
    alert('Failed to scan barcode: ' + error.message)
    document.querySelector('body')?.classList.remove('barcode-scanner-active')
  } finally {
    scanning.value = false
  }
}

async function scanBarcodeBrowser() {
  try {
    showBrowserScanner.value = true
    
    // Wait for the DOM to be ready
    await nextTick()
    
    console.log('[Browser Scanner] Starting camera with Quagga2...')
    
    const config = {
      inputStream: {
        name: 'Live',
        type: 'LiveStream',
        target: document.querySelector('#qr-reader'),
        constraints: {
          width: { min: 640 },
          height: { min: 480 },
          facingMode: 'environment', // Use back camera on mobile
          aspectRatio: { min: 1, max: 2 }
        },
        area: { // defines rectangle of the detection/localization area
          top: '20%',    // top offset
          right: '10%',  // right offset
          left: '10%',   // left offset
          bottom: '20%'  // bottom offset
        },
      },
      decoder: {
        readers: [
          'ean_reader',        // EAN-13, EAN-8
          'ean_8_reader',      // EAN-8
          'code_128_reader',   // Code 128
          'code_39_reader',    // Code 39
          'upc_reader',        // UPC-A, UPC-E
          'upc_e_reader',      // UPC-E
        ],
        debug: {
          drawBoundingBox: true,
          showFrequency: true,
          drawScanline: true,
          showPattern: true
        },
        multiple: false
      },
      locate: true,
      frequency: 10,
      locator: {
        patchSize: 'medium',
        halfSample: true
      },
      numOfWorkers: 4,
    }
    
    Quagga.init(config, (err) => {
      if (err) {
        console.error('[Browser Scanner] Initialization error:', err)
        alert('Failed to start camera: ' + err.message)
        stopBrowserScanner()
        return
      }
      console.log('[Browser Scanner] Camera started successfully')
      Quagga.start()
      quaggaInitialized = true
    })
    
    // Set up detection handler
    Quagga.onDetected(async (result) => {
      const code = result.codeResult.code
      const format = result.codeResult.format
      
      console.log('[Browser Scanner] ✅ Scanned successfully:', code)
      console.log('[Browser Scanner] Format:', format)
      console.log('[Browser Scanner] Confidence:', result.codeResult.decodedCodes)
      
      // Only accept high-confidence scans
      if (result.codeResult.decodedCodes.length > 0) {
        // Stop scanner and handle barcode
        await stopBrowserScanner()
        await handleScannedBarcode(code)
      }
    })
    
  } catch (error) {
    console.error('[Browser Scanner] Error:', error)
    alert('Failed to start camera. Please ensure you have granted camera permissions.')
    await stopBrowserScanner()
  }
}

async function stopBrowserScanner() {
  try {
    if (quaggaInitialized) {
      console.log('[Browser Scanner] Stopping Quagga...')
      Quagga.offDetected()
      Quagga.stop()
      console.log('[Browser Scanner] Stopped successfully')
      quaggaInitialized = false
    }
  } catch (error) {
    console.error('[Browser Scanner] Error stopping:', error)
  } finally {
    showBrowserScanner.value = false
    scanning.value = false
    manualBarcode.value = ''
  }
}

async function handleManualBarcode() {
  if (!manualBarcode.value) return
  
  console.log('[Manual Barcode] User entered:', manualBarcode.value)
  await stopBrowserScanner()
  await handleScannedBarcode(manualBarcode.value)
}

async function handleScannedBarcode(scannedBarcode) {
  console.log('[Barcode] Looking up product:', scannedBarcode)
  barcode.value = scannedBarcode
  
  // Show loading state
  scanning.value = true
  
  try {
    // Automatically look up the product
    const product = await foodStore.getProduct(scannedBarcode)
    if (product) {
      console.log('[Barcode] ✅ Product found:', product.name)
      selectedProduct.value = product
    } else {
      console.log('[Barcode] ❌ Product not found')
      alert('Product not found. The barcode might not be in the database.')
    }
  } catch (error) {
    console.error('[Barcode] Error looking up product:', error)
    alert('Error looking up product: ' + error.message)
  } finally {
    scanning.value = false
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
  margin-top: 1rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.5rem;
}

.search-box {
  padding: 0;
}

.barcode-box.mobile {
  padding: 0;
}

.barcode-box.desktop {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.input-with-icon {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.input-with-icon .search-input,
.input-with-icon .barcode-input {
  padding-right: 3rem;
}

.camera-icon-btn,
.clear-icon-btn {
  position: absolute;
  right: 0.5rem;
  padding: 0.5rem;
  background: rgba(102, 126, 234, 0.2);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  min-width: auto;
  border: none;
  cursor: pointer;
}

.clear-icon-btn {
  background: rgba(245, 87, 108, 0.2);
}

.camera-icon-btn:hover:not(:disabled),
.clear-icon-btn:hover {
  background: rgba(102, 126, 234, 0.3);
  transform: none;
  box-shadow: none;
}

.clear-icon-btn:hover {
  background: rgba(245, 87, 108, 0.3);
}

.camera-icon-btn:disabled {
  opacity: 0.3;
}

.camera-icon-btn svg,
.clear-icon-btn svg {
  display: block;
}

.scan-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  font-size: 1.1rem;
  font-weight: 600;
}

.scan-btn:disabled {
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.5) 0%, rgba(0, 242, 254, 0.5) 100%);
}

.scan-btn svg {
  display: block;
}

.search-input, .barcode-input {
  flex: 1;
  width: 100%;
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
  white-space: nowrap;
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  top: 0;
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
  overflow-y: auto;
  /* paddingTop is set dynamically via inline style based on navbar height */
}

.modal-content {
  background: rgba(15, 15, 15, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  /* max-height is set dynamically via inline style based on navbar height */
  overflow-y: auto;
  position: relative;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  margin: auto;
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

/* Barcode Scanner Active State */
:global(body.barcode-scanner-active) {
  visibility: hidden;
  background: transparent !important;
}

:global(body.barcode-scanner-active .barcode-scanner-ui) {
  visibility: visible;
}

/* Browser Barcode Scanner Modal */
.scanner-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.scanner-container {
  max-width: 600px;
  width: 100%;
  background: rgba(15, 15, 15, 0.98);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.scanner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.scanner-header h2 {
  color: white;
  margin: 0;
  font-size: 1.5rem;
}

.scanner-close-btn {
  background: rgba(255, 255, 255, 0.05);
  color: white;
  border: none;
  font-size: 2rem;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
  transition: all 0.2s;
}

.scanner-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: none;
}

#qr-reader {
  border-radius: 12px;
  overflow: hidden;
  background: #000;
  position: relative;
  width: 100%;
  min-height: 400px;
}

#qr-reader video {
  width: 100%;
  height: auto;
  border-radius: 12px;
}

#qr-reader canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* Quagga2 detection overlays */
#qr-reader canvas.drawingBuffer {
  position: absolute;
  top: 0;
  left: 0;
}

.scanner-instructions {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 1rem;
  margin-bottom: 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

.scanner-instructions small {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.scanner-manual {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.scanner-or {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.scanner-input-group {
  display: flex;
  gap: 0.5rem;
}

.scanner-manual-input {
  flex: 1;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
}

.scanner-manual-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.scanner-manual-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: #667eea;
}

.scanner-manual-btn {
  padding: 0.75rem 1.5rem;
  white-space: nowrap;
}

/* Mobile responsive adjustments for scanner */
@media (max-width: 768px) {
  .scanner-container {
    padding: 1rem;
  }
  
  #qr-reader {
    min-height: 300px;
  }
}

/* Infinite Scroll Elements */
.scroll-trigger {
  height: 1px;
  width: 100%;
  margin-top: 2rem;
}

.loading-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 1rem;
}

.loading-more p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(102, 126, 234, 0.2);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.end-of-results {
  text-align: center;
  padding: 2rem;
  margin-top: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.end-of-results p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  margin: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .search-content {
    padding: 1rem;
  }
  
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .loading-more {
    padding: 1.5rem;
  }

  .spinner {
    width: 32px;
    height: 32px;
  }

  /* Ensure barcode box doesn't overflow */
  .barcode-box.desktop {
    flex-wrap: nowrap;
    overflow: hidden;
  }

  .barcode-box.desktop .input-with-icon {
    min-width: 0;
  }

  .barcode-box.desktop button {
    flex-shrink: 0;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }

  h1 {
    font-size: 1.75rem;
  }

  .search-input, .barcode-input {
    font-size: 0.9rem;
  }

  /* Modal adjustments for mobile */
  .modal {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    padding-bottom: 0.5rem;
    align-items: flex-start;
    /* paddingTop is controlled by inline style for navbar offset */
  }

  .modal-content {
    /* max-height is controlled by inline style for navbar offset */
    padding: 1.5rem;
    margin-top: 0;
  }

  .product-detail h2 {
    font-size: 1.25rem;
  }

  .serving-calculator {
    padding: 1rem;
  }
}
</style>

