<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning'
import { Capacitor } from '@capacitor/core'
import { useAuthStore } from '@/stores/auth'
import { useDayStore } from '@/stores/day'
import { useFoodStore } from '@/stores/food'
import { useListsStore } from '@/stores/lists'
import { useDaySwipe } from '@/shared/composables/useDaySwipe'
import { useLocaleRoute } from '@/shared/composables/useLocaleRoute'

const authStore = useAuthStore()
const dayStore = useDayStore()
const foodStore = useFoodStore()
const listsStore = useListsStore()
const { localePath, pushLocale, route, router } = useLocaleRoute()

const query = ref('')
const barcode = ref('')
const manualBarcode = ref('')
const selectedProduct = ref(null)
const servingGrams = ref(100)
const scanning = ref(false)
const showManualBarcode = ref(false)
const showBrowserScanner = ref(false)
const statusMessage = ref('')
const statusTone = ref('neutral')
const scrollTrigger = ref(null)
const productSheet = ref(null)
const servingInput = ref(null)
const productSheetOffsetY = ref(0)
const productSheetTransition = ref('transform 0.22s ease')
const showListPicker = ref(false)

let searchTimeout = null
let intersectionObserver = null
let barcodeDetector = null
let videoStream = null
let statusTimeout = null
let productSheetStartY = 0
let productSheetStartScrollTop = 0
let productSheetDragging = false

const calculatedNutrients = computed(() => {
  if (!selectedProduct.value) return {}
  return foodStore.calculateServingNutrients(selectedProduct.value, servingGrams.value)
})
const targetListId = computed(() => (typeof route.query.list === 'string' ? route.query.list : ''))
const targetList = computed(() => listsStore.getListById(targetListId.value))
const isOverlayOpen = computed(() => Boolean(selectedProduct.value) || showBrowserScanner.value || showListPicker.value)
const { handleTouchStart, handleTouchEnd, handleTouchCancel } = useDaySwipe({
  onSwipePrevious: () => dayStore.previousDay(),
  onSwipeNext: () => dayStore.nextDay(),
  isDisabled: () => isOverlayOpen.value,
})

watch(
  () => foodStore.hasSearchResults,
  (hasResults) => {
    if (hasResults) {
      nextTick(setupInfiniteScroll)
      return
    }

    if (intersectionObserver) {
      intersectionObserver.disconnect()
      intersectionObserver = null
    }
  }
)

watch(isOverlayOpen, (isOpen) => {
  toggleBodyScrollLock(isOpen)
})

watch(
  () => authStore.user?.id,
  (userId) => {
    listsStore.syncWithUser(userId)
  },
  { immediate: true }
)

onMounted(async () => {
  if (!authStore.user) {
    pushLocale('/auth')
    return
  }

  if (!dayStore.currentEntry) {
    await dayStore.loadEntry()
  }
})

onUnmounted(() => {
  clearTimeout(searchTimeout)
  clearTimeout(statusTimeout)
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }
  toggleBodyScrollLock(false)
  stopBrowserScanner()
})

function toggleBodyScrollLock(isLocked) {
  document.documentElement.classList.toggle('mobile-sheet-open', isLocked)
  document.body.classList.toggle('mobile-sheet-open', isLocked)
}

function setStatus(message, tone = 'neutral') {
  statusMessage.value = message
  statusTone.value = tone
  clearTimeout(statusTimeout)
  statusTimeout = setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}

function handleSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    if (query.value.trim()) {
      foodStore.search(query.value)
      return
    }

    foodStore.clearSearch()
  }, 250)
}

function clearSearch() {
  query.value = ''
  foodStore.clearSearch()
}

function selectProduct(product) {
  selectedProduct.value = product
  servingGrams.value = product.serving_quantity || 100
  productSheetOffsetY.value = 0
  productSheetTransition.value = 'transform 0.22s ease'
  showListPicker.value = false
}

function closeProductSheet() {
  productSheetOffsetY.value = 0
  productSheetTransition.value = 'transform 0.22s ease'
  showListPicker.value = false
  selectedProduct.value = null
}

function focusServingInput() {
  servingInput.value?.focus()
  servingInput.value?.select?.()
}

function handleProductSheetTouchStart(event) {
  if (!productSheet.value) return

  productSheetStartY = event.touches[0].clientY
  productSheetStartScrollTop = productSheet.value.scrollTop
  productSheetDragging = false
  productSheetTransition.value = 'none'
}

function handleProductSheetTouchMove(event) {
  if (!productSheet.value) return

  const currentY = event.touches[0].clientY
  const deltaY = currentY - productSheetStartY

  if (deltaY <= 0) {
    return
  }

  if (productSheetStartScrollTop > 0 || productSheet.value.scrollTop > 0) {
    return
  }

  productSheetDragging = true
  productSheetOffsetY.value = deltaY

  if (event.cancelable) {
    event.preventDefault()
  }
}

function handleProductSheetTouchEnd() {
  if (!productSheetDragging) {
    productSheetTransition.value = 'transform 0.22s ease'
    return
  }

  productSheetTransition.value = 'transform 0.22s ease'

  if (productSheetOffsetY.value > 140) {
    productSheetOffsetY.value = window.innerHeight
    window.setTimeout(() => {
      closeProductSheet()
    }, 180)
  } else {
    productSheetOffsetY.value = 0
  }

  productSheetDragging = false
}

async function addToLog() {
  if (!selectedProduct.value || servingGrams.value <= 0) return

  try {
    await dayStore.addItem(selectedProduct.value, servingGrams.value, calculatedNutrients.value)
    setStatus(`Added ${selectedProduct.value.name}`, 'success')
    closeProductSheet()
  } catch (error) {
    setStatus(error.message, 'error')
  }
}

function openListPicker() {
  if (!listsStore.hasLists) {
    openListsScreen()
    return
  }

  showListPicker.value = true
}

function closeListPicker() {
  showListPicker.value = false
}

function openListsScreen() {
  router.push({ path: localePath('/app/lists') })
  closeProductSheet()
}

async function addToList(listId) {
  if (!selectedProduct.value || servingGrams.value <= 0) return

  try {
    const list = listsStore.getListById(listId)
    if (!list) {
      throw new Error('List not found')
    }

    listsStore.addItemToList(listId, selectedProduct.value, servingGrams.value, calculatedNutrients.value)
    setStatus(`Saved ${selectedProduct.value.name} to ${list.name}`, 'success')
    closeProductSheet()
  } catch (error) {
    setStatus(error.message, 'error')
  }
}

async function lookupBarcode() {
  if (!barcode.value) return
  const product = await foodStore.getProduct(barcode.value)
  if (product) {
    selectProduct(product)
    return
  }

  setStatus(foodStore.productError || 'Product not found', 'error')
}

async function handleScannedBarcode(scannedBarcode) {
  barcode.value = scannedBarcode
  await lookupBarcode()
}

async function scanBarcode() {
  scanning.value = true

  if (Capacitor.isNativePlatform()) {
    await scanBarcodeNative()
  } else {
    await scanBarcodeBrowser()
  }
}

async function scanBarcodeNative() {
  try {
    const { camera } = await BarcodeScanner.checkPermissions()

    if (camera === 'denied') {
      setStatus('Camera access is disabled for barcode scanning', 'error')
      return
    }

    if (camera !== 'granted') {
      const permission = await BarcodeScanner.requestPermissions()
      if (permission.camera !== 'granted') {
        setStatus('Camera permission was not granted', 'error')
        return
      }
    }

    document.body.classList.add('barcode-scanner-active')
    const result = await BarcodeScanner.scan()
    document.body.classList.remove('barcode-scanner-active')

    if (result.barcodes?.length) {
      await handleScannedBarcode(result.barcodes[0].rawValue)
    }
  } catch (error) {
    document.body.classList.remove('barcode-scanner-active')
    setStatus(error.message, 'error')
  } finally {
    scanning.value = false
  }
}

async function scanBarcodeBrowser() {
  try {
    if (!('BarcodeDetector' in window)) {
      showManualBarcode.value = true
      setStatus('Barcode scanning is unavailable here. Use manual entry.', 'error')
      return
    }

    showBrowserScanner.value = true
    await nextTick()

    const supportedFormats = await BarcodeDetector.getSupportedFormats()
    const formats = supportedFormats.filter((format) =>
      ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'].includes(format)
    )

    barcodeDetector = new BarcodeDetector({ formats })

    const video = document.getElementById('mobile-barcode-video')
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
      },
    })

    video.srcObject = videoStream
    await video.play()

    scanFrame(video)
  } catch (error) {
    setStatus(`Scanner error: ${error.message}`, 'error')
    await stopBrowserScanner()
  } finally {
    scanning.value = false
  }
}

async function scanFrame(video) {
  if (!barcodeDetector || !videoStream) return

  try {
    const barcodes = await barcodeDetector.detect(video)
    if (barcodes.length > 0) {
      await stopBrowserScanner()
      await handleScannedBarcode(barcodes[0].rawValue)
      return
    }
  } catch (error) {
    if (error.name !== 'NotSupportedError') {
      console.debug(error.message)
    }
  }

  requestAnimationFrame(() => scanFrame(video))
}

async function stopBrowserScanner() {
  if (videoStream) {
    videoStream.getTracks().forEach((track) => track.stop())
    videoStream = null
  }

  const video = document.getElementById('mobile-barcode-video')
  if (video) {
    video.srcObject = null
  }

  barcodeDetector = null
  showBrowserScanner.value = false
  scanning.value = false
}

function setupInfiniteScroll() {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }

  if (!scrollTrigger.value) return

  intersectionObserver = new IntersectionObserver((entries) => {
    const first = entries[0]
    if (first.isIntersecting && foodStore.searchHasMore && !foodStore.searchLoadingMore) {
      foodStore.loadMore()
    }
  }, { rootMargin: '240px' })

  intersectionObserver.observe(scrollTrigger.value)
}
</script>

<template>
  <section
    class="mobile-search"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    @touchcancel="handleTouchCancel"
  >
    <div class="search-stack">
      <div class="search-panel">
        <label class="field-block">
          <span>Search products</span>
          <div class="field-row">
            <input
              v-model="query"
              type="text"
              :placeholder="$t('search.searchPlaceholder')"
              @input="handleSearch"
            >
            <button v-if="query" class="icon-btn" @click="clearSearch">×</button>
          </div>
        </label>

        <div class="action-grid">
          <button class="scan-btn" @click="scanBarcode" :disabled="scanning">
            {{ scanning ? $t('search.scanning') : $t('search.scanBarcode') }}
          </button>
          <button class="ghost-btn" @click="showManualBarcode = !showManualBarcode">
            {{ showManualBarcode ? 'Hide code input' : 'Enter barcode' }}
          </button>
        </div>

        <div v-if="showManualBarcode" class="manual-code">
          <div class="field-row">
            <input
              v-model="barcode"
              type="text"
              :placeholder="$t('search.barcodePlaceholder')"
              @keyup.enter="lookupBarcode"
            >
            <button class="lookup-btn" @click="lookupBarcode">{{ $t('search.lookup') }}</button>
          </div>
        </div>
      </div>

      <p v-if="statusMessage" :class="['status-banner', statusTone]">{{ statusMessage }}</p>
      <p v-if="foodStore.searchError || foodStore.productError" class="status-banner error">
        {{ foodStore.searchError || foodStore.productError }}
      </p>

      <section class="results-section">
        <div class="section-head">
          <div>
            <p class="eyebrow">Results</p>
            <h2>{{ foodStore.searchResults.length }}</h2>
          </div>
          <small v-if="foodStore.searchTotalCount > 0">of {{ foodStore.searchTotalCount }}</small>
        </div>

        <div v-if="foodStore.searchLoading && !foodStore.hasSearchResults" class="state-card">
          {{ $t('search.loading') }}
        </div>
        <div v-else-if="!foodStore.hasSearchResults" class="state-card">
          Start typing to search Open Food Facts.
        </div>

        <div v-else class="product-list">
          <article
            v-for="product in foodStore.searchResults"
            :key="product.code"
            class="product-card"
            @click="selectProduct(product)"
          >
            <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="product-image">
            <div class="product-copy">
              <strong>{{ product.name }}</strong>
              <span>{{ product.brand || $t('search.product.brand') }}</span>
              <small>
                {{ product.nutriments.energy_kcal }} kcal ·
                P {{ product.nutriments.proteins }}g ·
                C {{ product.nutriments.carbohydrates }}g ·
                F {{ product.nutriments.fat }}g
              </small>
            </div>
          </article>

          <div v-if="foodStore.searchLoadingMore" class="state-card">Loading more…</div>
          <div ref="scrollTrigger" class="scroll-trigger"></div>
        </div>
      </section>
    </div>

    <div v-if="selectedProduct" class="sheet-backdrop" @click="closeProductSheet">
      <div
        ref="productSheet"
        class="sheet"
        :style="{
          transform: `translateY(${productSheetOffsetY}px)`,
          transition: productSheetTransition,
        }"
        @click.stop
        @touchstart="handleProductSheetTouchStart"
        @touchmove="handleProductSheetTouchMove"
        @touchend="handleProductSheetTouchEnd"
        @touchcancel="handleProductSheetTouchEnd"
      >
        <div class="sheet-header">
          <div>
            <p class="eyebrow">Add to diary</p>
            <h3>{{ selectedProduct.name }}</h3>
            <span>{{ selectedProduct.brand }}</span>
          </div>
          <button class="close-btn" @click="closeProductSheet">×</button>
        </div>

        <img v-if="selectedProduct.image_url" :src="selectedProduct.image_url" :alt="selectedProduct.name" class="sheet-image">

        <label class="sheet-field">
          <span>{{ $t('search.calculator.servingSize') }}</span>
          <div class="serving-input-row">
            <input ref="servingInput" v-model.number="servingGrams" type="number" min="1" step="1">
            <button type="button" class="serving-edit-btn" @click="focusServingInput" aria-label="Edit serving size">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M12.085 6.5l5.415 5.415l-8.793 8.792a1 1 0 0 1 -.707 .293h-4a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 .293 -.707zm5.406 -2.698a3.828 3.828 0 0 1 1.716 6.405l-.292 .293l-5.415 -5.415l.293 -.292a3.83 3.83 0 0 1 3.698 -.991" />
              </svg>
            </button>
          </div>
        </label>

        <div class="nutrient-grid">
          <div>
            <span>Kcal</span>
            <strong>{{ calculatedNutrients.energy_kcal }}</strong>
          </div>
          <div>
            <span>Protein</span>
            <strong>{{ calculatedNutrients.proteins }}g</strong>
          </div>
          <div>
            <span>Carbs</span>
            <strong>{{ calculatedNutrients.carbohydrates }}g</strong>
          </div>
          <div>
            <span>Fat</span>
            <strong>{{ calculatedNutrients.fat }}g</strong>
          </div>
        </div>

        <div class="sheet-actions">
          <button class="add-btn" @click="addToLog">{{ $t('search.addButton', { grams: servingGrams }) }}</button>
          <button
            v-if="targetList"
            class="secondary-btn"
            @click="addToList(targetList.id)"
          >
            Add {{ servingGrams }}g to {{ targetList.name }}
          </button>
          <button
            v-else-if="listsStore.hasLists"
            class="secondary-btn"
            @click="openListPicker"
          >
            Add to list
          </button>
          <button
            v-else
            class="secondary-btn"
            @click="openListsScreen"
          >
            Create a list first
          </button>
        </div>
      </div>
    </div>

    <div v-if="showListPicker" class="sheet-backdrop nested" @click="closeListPicker">
      <div class="sheet picker-sheet" @click.stop>
        <div class="sheet-header">
          <div>
            <p class="eyebrow">Choose list</p>
            <h3>Save {{ selectedProduct?.name }}</h3>
          </div>
          <button class="close-btn" @click="closeListPicker">×</button>
        </div>

        <div class="list-picker-grid">
          <button
            v-for="list in listsStore.lists"
            :key="list.id"
            class="list-picker-btn"
            @click="addToList(list.id)"
          >
            <strong>{{ list.name }}</strong>
            <span>{{ list.items.length }} item<span v-if="list.items.length !== 1">s</span></span>
          </button>
        </div>

        <button class="secondary-btn manage-btn" @click="openListsScreen">Manage lists</button>
      </div>
    </div>

    <div v-if="showBrowserScanner" class="sheet-backdrop" @click="stopBrowserScanner">
      <div class="sheet" @click.stop>
        <div class="sheet-header">
          <div>
            <p class="eyebrow">Scanner</p>
            <h3>{{ $t('search.scanner.title') }}</h3>
          </div>
          <button class="close-btn" @click="stopBrowserScanner">×</button>
        </div>
        <div class="video-shell">
          <video id="mobile-barcode-video" autoplay playsinline></video>
        </div>
        <label class="sheet-field">
          <span>Manual barcode</span>
          <input v-model="manualBarcode" type="text" placeholder="Enter barcode" @keyup.enter="handleScannedBarcode(manualBarcode)">
        </label>
      </div>
    </div>
  </section>
</template>

<style scoped>
.mobile-search {
  padding: 1rem;
  color: white;
}

.search-stack {
  display: grid;
  gap: 0.9rem;
}

.search-panel,
.results-section {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 26px;
  padding: 1rem;
  backdrop-filter: blur(18px);
}

.field-block span,
.eyebrow,
.sheet-field span {
  display: block;
  margin-bottom: 0.45rem;
  color: rgba(255, 214, 138, 0.85);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.field-row {
  display: flex;
  gap: 0.65rem;
  align-items: center;
}

input {
  flex: 1;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  padding: 1rem;
  font: inherit;
}

input:focus {
  outline: none;
  border-color: rgba(255, 209, 102, 0.7);
}

.icon-btn,
.lookup-btn,
.scan-btn,
.ghost-btn,
.add-btn,
.close-btn,
.secondary-btn,
.list-picker-btn {
  border: none;
  font: inherit;
}

.icon-btn,
.lookup-btn,
.ghost-btn,
.secondary-btn,
.list-picker-btn {
  padding: 0.95rem 1rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-top: 0.9rem;
}

.scan-btn,
.add-btn {
  padding: 1rem;
  border-radius: 20px;
  background: linear-gradient(135deg, #ffd166 0%, #ef8354 100%);
  color: #18120d;
  font-weight: 700;
}

.manual-code {
  margin-top: 0.85rem;
}

.status-banner {
  margin: 0;
  padding: 0.95rem 1rem;
  border-radius: 18px;
  font-size: 0.92rem;
}

.status-banner.success {
  background: rgba(80, 200, 120, 0.12);
  color: #9fe1a9;
}

.status-banner.error {
  background: rgba(255, 95, 95, 0.12);
  color: #ffadad;
}

.results-section h2,
.sheet h3 {
  margin: 0;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 0.8rem;
}

.section-head small {
  color: rgba(255, 255, 255, 0.65);
}

.product-list {
  display: grid;
  gap: 0.75rem;
}

.product-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.8rem;
  align-items: center;
  padding: 0.9rem;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.04);
}

.product-image {
  width: 4.25rem;
  height: 4.25rem;
  border-radius: 16px;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.4rem;
}

.product-copy {
  display: grid;
  gap: 0.25rem;
}

.product-copy span,
.product-copy small {
  color: rgba(255, 255, 255, 0.68);
  line-height: 1.4;
}

.state-card {
  padding: 1rem;
  text-align: center;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
}

.scroll-trigger {
  height: 1px;
}

.sheet-backdrop {
  position: fixed;
  top: var(--mobile-header-height, 0px);
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.55);
  overscroll-behavior: contain;
  z-index: 60;
}

.sheet-backdrop.nested {
  z-index: 70;
  background: rgba(0, 0, 0, 0.35);
}

.sheet {
  width: 100%;
  max-height: 88vh;
  overflow: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  padding: 1.25rem 1rem calc(env(safe-area-inset-bottom, 0px) + 1rem);
  background: #17151c;
  border-radius: 28px 28px 0 0;
}

.picker-sheet {
  max-height: 72vh;
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.sheet-header span {
  color: rgba(255, 255, 255, 0.64);
}

.close-btn {
  flex: 0 0 auto;
  width: 3rem;
  height: 3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1.9rem;
  line-height: 1;
}

.sheet-image {
  width: 100%;
  max-height: 180px;
  object-fit: contain;
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.05);
}

.sheet-field {
  display: grid;
  gap: 0.45rem;
  margin-top: 1rem;
}

.serving-input-row {
  position: relative;
}

.serving-input-row input {
  padding-right: 4rem;
}

.serving-edit-btn {
  position: absolute;
  top: 50%;
  right: 0.7rem;
  transform: translateY(-50%);
  width: 2.6rem;
  height: 2.6rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  line-height: 1;
}

.serving-edit-btn svg {
  display: block;
}

.nutrient-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.nutrient-grid div {
  padding: 0.85rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
}

.nutrient-grid span {
  display: block;
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.82rem;
}

.nutrient-grid strong {
  display: block;
  margin-top: 0.35rem;
  font-size: 1.15rem;
}

.sheet-actions {
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;
}

.add-btn,
.secondary-btn {
  width: 100%;
}

.list-picker-grid {
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;
}

.list-picker-btn {
  display: grid;
  gap: 0.2rem;
  text-align: left;
}

.list-picker-btn span {
  color: rgba(255, 255, 255, 0.66);
}

.manage-btn {
  margin-top: 0.9rem;
}

.video-shell {
  border-radius: 24px;
  overflow: hidden;
  background: black;
  margin-top: 1rem;
}

.video-shell video {
  width: 100%;
  display: block;
}

:global(body.barcode-scanner-active) {
  background: transparent;
  visibility: hidden;
}

:global(body.barcode-scanner-active .mobile-search) {
  visibility: hidden;
}

:global(html.mobile-sheet-open),
:global(body.mobile-sheet-open) {
  overflow: hidden;
  overscroll-behavior: none;
}
</style>
