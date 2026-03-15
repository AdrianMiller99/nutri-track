<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useDayStore } from '@/stores/day'
import { useLocaleRoute } from '@/shared/composables/useLocaleRoute'

const SWIPE_COMMIT_RATIO = 0.24
const SWIPE_MIN_DISTANCE = 60
const SWIPE_TRANSITION = 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)'

const authStore = useAuthStore()
const dayStore = useDayStore()
const { pushLocale } = useLocaleRoute()
const { t } = useI18n()

const dashboardViewport = ref(null)
const editingItem = ref(null)
const editServingGrams = ref(0)
const editServingInput = ref(null)
const touchStartX = ref(null)
const touchStartY = ref(null)
const dragX = ref(0)
const dragDirection = ref(null)
const panelTransition = ref(SWIPE_TRANSITION)
const gestureMode = ref('idle')
const incomingPanelVisible = ref(false)
const incomingPanelDocked = ref(false)
const hideCurrentPanel = ref(false)

const skeletonMacroCards = [1, 2, 3, 4]
const skeletonDetailRows = [1, 2, 3]
const skeletonItems = [1, 2, 3]

const macroCards = computed(() => [
  { label: t('dashboard.totals.calories'), value: Math.round(dayStore.totals.kcal), unit: 'kcal', tone: 'warm' },
  { label: t('dashboard.totals.protein'), value: dayStore.totals.protein_g, unit: 'g', tone: 'green' },
  { label: t('dashboard.totals.carbs'), value: dayStore.totals.carb_g, unit: 'g', tone: 'amber' },
  { label: t('dashboard.totals.fat'), value: dayStore.totals.fat_g, unit: 'g', tone: 'rose' },
])

const detailRows = computed(() => [
  { label: t('dashboard.totals.fiber'), value: `${dayStore.totals.fiber_g}g` },
  { label: t('dashboard.totals.sugar'), value: `${dayStore.totals.sugar_g}g` },
  { label: t('dashboard.totals.sodium'), value: `${Math.round(dayStore.totals.sodium_mg)}mg` },
])

const viewportWidth = computed(() => dashboardViewport.value?.clientWidth || window.innerWidth || 1)
const currentPanelStyle = computed(() => ({
  transform: `translate3d(${dragX.value}px, 0, 0)`,
  transition: panelTransition.value,
}))
const incomingPanelStyle = computed(() => {
  if (!incomingPanelVisible.value || !dragDirection.value) {
    return {}
  }

  let translateX = 0
  if (incomingPanelDocked.value) {
    translateX = 0
  } else if (dragDirection.value === 'previous') {
    translateX = dragX.value - viewportWidth.value
  } else {
    translateX = dragX.value + viewportWidth.value
  }

  return {
    transform: `translate3d(${translateX}px, 0, 0)`,
    transition: panelTransition.value,
  }
})
const isInteractionDisabled = computed(() => Boolean(editingItem.value) || dayStore.savingItem)

onMounted(async () => {
  if (!authStore.user) {
    pushLocale('/auth')
    return
  }

  await dayStore.loadEntry()
})

function openAddFood() {
  pushLocale('/app/search')
}

function startEdit(item) {
  editingItem.value = item
  editServingGrams.value = item.serving_grams
  nextTick(() => {
    editServingInput.value?.focus()
    editServingInput.value?.select?.()
  })
}

function closeEdit() {
  editingItem.value = null
  editServingGrams.value = 0
}

function focusEditServingInput() {
  editServingInput.value?.focus()
  editServingInput.value?.select?.()
}

async function saveEdit() {
  if (!editingItem.value || editServingGrams.value <= 0) return
  await dayStore.updateItemServing(editingItem.value.id, editServingGrams.value)
  closeEdit()
}

async function deleteItem(item) {
  const confirmed = window.confirm(t('dashboard.confirmDelete', { item: item.label }))
  if (!confirmed) return
  await dayStore.deleteItem(item.id)
}

function isInteractiveTarget(target) {
  return Boolean(target?.closest('input, textarea, button, a, label, select, [data-no-day-swipe]'))
}

function resetSwipeState() {
  touchStartX.value = null
  touchStartY.value = null
  dragX.value = 0
  dragDirection.value = null
  gestureMode.value = 'idle'
  incomingPanelVisible.value = false
  incomingPanelDocked.value = false
  panelTransition.value = SWIPE_TRANSITION
}

function normalizeSettledPanel() {
  if (!incomingPanelVisible.value || !incomingPanelDocked.value || !hideCurrentPanel.value) {
    return
  }

  panelTransition.value = 'none'
  dragX.value = 0
  hideCurrentPanel.value = false
  incomingPanelVisible.value = false
  incomingPanelDocked.value = false
  dragDirection.value = null
}

function snapBack() {
  gestureMode.value = 'settling'
  panelTransition.value = SWIPE_TRANSITION
  dragX.value = 0
  incomingPanelVisible.value = false
  incomingPanelDocked.value = false
  window.setTimeout(() => {
    if (gestureMode.value === 'settling') {
      resetSwipeState()
    }
  }, 260)
}

async function commitSwipe(direction) {
  const isNext = direction === 'next'
  if (isNext && !dayStore.canGoForward) {
    snapBack()
    return
  }

  gestureMode.value = 'settling'
  panelTransition.value = SWIPE_TRANSITION
  incomingPanelVisible.value = true
  incomingPanelDocked.value = false
  dragDirection.value = direction
  dragX.value = direction === 'previous' ? viewportWidth.value : -viewportWidth.value

  const navigationPromise = direction === 'previous' ? dayStore.previousDay() : dayStore.nextDay()

  try {
    await Promise.all([
      navigationPromise,
      new Promise((resolve) => window.setTimeout(resolve, 260)),
    ])
  } finally {
    hideCurrentPanel.value = true
    incomingPanelDocked.value = true
    panelTransition.value = 'none'
    dragX.value = 0
    touchStartX.value = null
    touchStartY.value = null
    gestureMode.value = 'idle'
  }
}

function handleSwipeStart(event) {
  if (isInteractionDisabled.value || dayStore.loading) return
  normalizeSettledPanel()
  if (isInteractiveTarget(event.target)) {
    resetSwipeState()
    return
  }

  const touch = event.touches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  gestureMode.value = 'pending'
  panelTransition.value = 'none'
}

function handleSwipeMove(event) {
  if (touchStartX.value === null || touchStartY.value === null) {
    return
  }

  const touch = event.touches[0]
  const deltaX = touch.clientX - touchStartX.value
  const deltaY = touch.clientY - touchStartY.value

  if (gestureMode.value === 'pending') {
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      return
    }

    if (Math.abs(deltaX) <= Math.abs(deltaY) * 1.1) {
      gestureMode.value = 'vertical'
      return
    }

    gestureMode.value = 'horizontal'
  }

  if (gestureMode.value !== 'horizontal') {
    return
  }

  let nextDragX = deltaX
  if (nextDragX < 0 && !dayStore.canGoForward) {
    nextDragX *= 0.18
  }

  const maxDistance = viewportWidth.value * 0.92
  nextDragX = Math.max(-maxDistance, Math.min(maxDistance, nextDragX))

  dragX.value = nextDragX
  dragDirection.value = nextDragX >= 0 ? 'previous' : 'next'
  incomingPanelVisible.value = Math.abs(nextDragX) > 0
  incomingPanelDocked.value = false

  if (event.cancelable) {
    event.preventDefault()
  }
}

async function handleSwipeEnd() {
  if (gestureMode.value !== 'horizontal') {
    resetSwipeState()
    return
  }

  const distance = Math.abs(dragX.value)
  const threshold = Math.max(SWIPE_MIN_DISTANCE, viewportWidth.value * SWIPE_COMMIT_RATIO)
  const direction = dragX.value >= 0 ? 'previous' : 'next'

  if (distance < threshold) {
    snapBack()
    return
  }

  await commitSwipe(direction)
}

function handleSwipeCancel() {
  if (gestureMode.value === 'horizontal') {
    snapBack()
    return
  }

  resetSwipeState()
}
</script>

<template>
  <section
    ref="dashboardViewport"
    class="mobile-dashboard"
    @touchstart="handleSwipeStart"
    @touchmove="handleSwipeMove"
    @touchend="handleSwipeEnd"
    @touchcancel="handleSwipeCancel"
  >
    <div class="dashboard-swipe-shell">
      <div
        v-if="incomingPanelVisible"
        class="dashboard-panel incoming-panel"
        :style="incomingPanelStyle"
      >
        <template v-if="dayStore.loading">
          <div class="dashboard-skeleton">
            <div class="macro-grid">
              <article v-for="card in skeletonMacroCards" :key="card" class="skeleton-card macro">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line tall"></div>
              </article>
            </div>

            <section class="detail-card">
              <div v-for="row in skeletonDetailRows" :key="row" class="detail-row">
                <div class="skeleton-line medium"></div>
                <div class="skeleton-line short"></div>
              </div>
            </section>

            <div class="primary-cta skeleton-block"></div>

            <section class="items-card">
              <div class="section-heading">
                <div class="section-copy">
                  <div class="skeleton-line short"></div>
                  <div class="skeleton-line medium"></div>
                </div>
                <div class="count-pill skeleton-pill"></div>
              </div>

              <div class="items-list">
                <article v-for="item in skeletonItems" :key="item" class="item-card skeleton-item-card">
                  <div class="item-image skeleton-block"></div>
                  <div class="item-copy">
                    <div class="skeleton-line medium"></div>
                    <div class="skeleton-line short"></div>
                    <div class="skeleton-line medium"></div>
                  </div>
                </article>
              </div>
            </section>
          </div>
        </template>

        <template v-else>
          <div class="macro-grid">
            <article v-for="card in macroCards" :key="`incoming-${card.label}`" :class="['macro-card', card.tone]">
              <p>{{ card.label }}</p>
              <strong>{{ card.value }}<span>{{ card.unit }}</span></strong>
            </article>
          </div>

          <section class="detail-card">
            <div class="detail-row" v-for="row in detailRows" :key="`incoming-${row.label}`">
              <span>{{ row.label }}</span>
              <strong>{{ row.value }}</strong>
            </div>
          </section>

          <button class="primary-cta" @click="openAddFood">{{ $t('dashboard.addFood') }}</button>

          <section class="items-card">
            <div class="section-heading">
              <div>
                <p class="section-eyebrow">{{ $t('dashboard.sectionEyebrow') }}</p>
                <h3>{{ $t('dashboard.loggedFoods') }}</h3>
              </div>
              <span class="count-pill">{{ dayStore.itemCount }}</span>
            </div>

            <div v-if="dayStore.itemsLoading" class="items-list">
              <article v-for="item in skeletonItems" :key="`incoming-skeleton-${item}`" class="item-card skeleton-item-card">
                <div class="item-image skeleton-block"></div>
                <div class="item-copy">
                  <div class="skeleton-line medium"></div>
                  <div class="skeleton-line short"></div>
                  <div class="skeleton-line medium"></div>
                </div>
              </article>
            </div>
            <div v-else-if="!dayStore.hasItems" class="empty-card">
              <p>{{ $t('dashboard.noItems') }}</p>
              <small>{{ $t('dashboard.addFoodHint') }}</small>
            </div>

            <div v-else class="items-list">
              <article v-for="item in dayStore.items" :key="`incoming-item-${item.id}`" class="item-card">
                <img v-if="item.image_url" :src="item.image_url" :alt="item.label" class="item-image">
                <div class="item-copy">
                  <strong>{{ item.label }}</strong>
                  <span v-if="item.brand">{{ item.brand }}</span>
                  <small>{{ item.serving_grams }}g · {{ Math.round(item.kcal) }} kcal</small>
                </div>
                <div class="item-macros">
                  <span>P {{ item.protein_g }}g</span>
                  <span>C {{ item.carb_g }}g</span>
                  <span>F {{ item.fat_g }}g</span>
                </div>
                <div class="item-actions">
                  <button class="icon-action" :aria-label="$t('dashboard.editServing.title')" @click="startEdit(item)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M12.085 6.5l5.415 5.415l-8.793 8.792a1 1 0 0 1 -.707 .293h-4a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 .293 -.707zm5.406 -2.698a3.828 3.828 0 0 1 1.716 6.405l-.292 .293l-5.415 -5.415l.293 -.292a3.83 3.83 0 0 1 3.698 -.991" />
                    </svg>
                  </button>
                  <button class="icon-action danger-icon-btn" :aria-label="$t('dashboard.delete')" @click="deleteItem(item)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M9 3a1 1 0 0 0 -.894 .553l-.382 .764l-3.724 .683a1 1 0 0 0 .18 1.984h.82l.724 10.138a3 3 0 0 0 2.992 2.778h6.568a3 3 0 0 0 2.992 -2.778l.724 -10.138h.82a1 1 0 0 0 .18 -1.984l-3.724 -.683l-.382 -.764a1 1 0 0 0 -.894 -.553zm0 2h6l.5 1h-7z" />
                    </svg>
                  </button>
                </div>
              </article>
            </div>
          </section>
        </template>
      </div>

      <div
        class="dashboard-panel current-panel"
        :class="{ 'panel-hidden': hideCurrentPanel }"
        :style="currentPanelStyle"
      >
        <template v-if="dayStore.loading">
          <div class="dashboard-skeleton">
            <div class="macro-grid">
              <article v-for="card in skeletonMacroCards" :key="card" class="skeleton-card macro">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line tall"></div>
              </article>
            </div>

            <section class="detail-card">
              <div v-for="row in skeletonDetailRows" :key="row" class="detail-row">
                <div class="skeleton-line medium"></div>
                <div class="skeleton-line short"></div>
              </div>
            </section>

            <div class="primary-cta skeleton-block"></div>

            <section class="items-card">
              <div class="section-heading">
                <div class="section-copy">
                  <div class="skeleton-line short"></div>
                  <div class="skeleton-line medium"></div>
                </div>
                <div class="count-pill skeleton-pill"></div>
              </div>

              <div class="items-list">
                <article v-for="item in skeletonItems" :key="item" class="item-card skeleton-item-card">
                  <div class="item-image skeleton-block"></div>
                  <div class="item-copy">
                    <div class="skeleton-line medium"></div>
                    <div class="skeleton-line short"></div>
                    <div class="skeleton-line medium"></div>
                  </div>
                </article>
              </div>
            </section>
          </div>
        </template>

        <template v-else>
          <div class="macro-grid">
            <article v-for="card in macroCards" :key="card.label" :class="['macro-card', card.tone]">
              <p>{{ card.label }}</p>
              <strong>{{ card.value }}<span>{{ card.unit }}</span></strong>
            </article>
          </div>

          <section class="detail-card">
            <div class="detail-row" v-for="row in detailRows" :key="row.label">
              <span>{{ row.label }}</span>
              <strong>{{ row.value }}</strong>
            </div>
          </section>

          <button class="primary-cta" @click="openAddFood">{{ $t('dashboard.addFood') }}</button>

          <section class="items-card">
            <div class="section-heading">
              <div>
                <p class="section-eyebrow">{{ $t('dashboard.sectionEyebrow') }}</p>
                <h3>{{ $t('dashboard.loggedFoods') }}</h3>
              </div>
              <span class="count-pill">{{ dayStore.itemCount }}</span>
            </div>

            <div v-if="dayStore.itemsLoading" class="items-list">
              <article v-for="item in skeletonItems" :key="item" class="item-card skeleton-item-card">
                <div class="item-image skeleton-block"></div>
                <div class="item-copy">
                  <div class="skeleton-line medium"></div>
                  <div class="skeleton-line short"></div>
                  <div class="skeleton-line medium"></div>
                </div>
              </article>
            </div>
            <div v-else-if="!dayStore.hasItems" class="empty-card">
              <p>{{ $t('dashboard.noItems') }}</p>
              <small>{{ $t('dashboard.addFoodHint') }}</small>
            </div>

            <div v-else class="items-list">
              <article v-for="item in dayStore.items" :key="item.id" class="item-card">
                <img v-if="item.image_url" :src="item.image_url" :alt="item.label" class="item-image">
                <div class="item-copy">
                  <strong>{{ item.label }}</strong>
                  <span v-if="item.brand">{{ item.brand }}</span>
                  <small>{{ item.serving_grams }}g · {{ Math.round(item.kcal) }} kcal</small>
                </div>
                <div class="item-macros">
                  <span>P {{ item.protein_g }}g</span>
                  <span>C {{ item.carb_g }}g</span>
                  <span>F {{ item.fat_g }}g</span>
                </div>
                <div class="item-actions">
                  <button class="icon-action" :aria-label="$t('dashboard.editServing.title')" @click="startEdit(item)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M12.085 6.5l5.415 5.415l-8.793 8.792a1 1 0 0 1 -.707 .293h-4a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 .293 -.707zm5.406 -2.698a3.828 3.828 0 0 1 1.716 6.405l-.292 .293l-5.415 -5.415l.293 -.292a3.83 3.83 0 0 1 3.698 -.991" />
                    </svg>
                  </button>
                  <button class="icon-action danger-icon-btn" :aria-label="$t('dashboard.delete')" @click="deleteItem(item)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M9 3a1 1 0 0 0 -.894 .553l-.382 .764l-3.724 .683a1 1 0 0 0 .18 1.984h.82l.724 10.138a3 3 0 0 0 2.992 2.778h6.568a3 3 0 0 0 2.992 -2.778l.724 -10.138h.82a1 1 0 0 0 .18 -1.984l-3.724 -.683l-.382 -.764a1 1 0 0 0 -.894 -.553zm0 2h6l.5 1h-7z" />
                    </svg>
                  </button>
                </div>
              </article>
            </div>
          </section>
        </template>
      </div>
    </div>

    <Transition name="sheet-transition">
      <div v-if="editingItem" class="sheet-backdrop" @click="closeEdit">
        <div class="sheet" @click.stop>
          <p class="section-eyebrow">{{ $t('dashboard.editServing.title') }}</p>
          <h3>{{ editingItem.label }}</h3>
          <label>
            <span>{{ $t('dashboard.editServing.label') }}</span>
            <div class="serving-input-row">
              <input ref="editServingInput" v-model.number="editServingGrams" type="number" min="1" step="1">
              <button type="button" class="serving-edit-btn" :aria-label="$t('dashboard.editServing.title')" @click="focusEditServingInput">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M12.085 6.5l5.415 5.415l-8.793 8.792a1 1 0 0 1 -.707 .293h-4a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 .293 -.707zm5.406 -2.698a3.828 3.828 0 0 1 1.716 6.405l-.292 .293l-5.415 -5.415l.293 -.292a3.83 3.83 0 0 1 3.698 -.991" />
                </svg>
              </button>
            </div>
          </label>
          <div class="sheet-actions">
            <button class="ghost" @click="closeEdit">{{ $t('dashboard.editServing.cancel') }}</button>
            <button class="save" @click="saveEdit">{{ $t('dashboard.editServing.save') }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.mobile-dashboard {
  padding: 1rem;
  color: white;
  overflow: hidden;
}

.dashboard-swipe-shell {
  position: relative;
  min-height: 60vh;
  overflow: hidden;
}

.dashboard-panel {
  width: 100%;
  will-change: transform;
}

.incoming-panel {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.current-panel {
  position: relative;
  z-index: 2;
}

.panel-hidden {
  visibility: hidden;
  pointer-events: none;
}

.items-card,
.detail-card {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 26px;
  backdrop-filter: blur(18px);
}

.section-eyebrow {
  margin: 0 0 0.25rem;
  color: rgba(255, 214, 138, 0.85);
  font-size: 0.74rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.section-heading h3,
.sheet h3 {
  margin: 0;
}

.primary-cta {
  width: 100%;
  border: none;
  border-radius: 20px;
  padding: 1rem;
  margin-top: 0.85rem;
  font: inherit;
  font-weight: 700;
}

.macro-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 0.85rem;
}

.macro-card,
.skeleton-card {
  padding: 1rem;
  border-radius: 24px;
  color: white;
}

.macro-card p {
  margin: 0 0 1rem;
  color: rgba(255, 255, 255, 0.76);
}

.macro-card strong {
  font-size: 1.9rem;
  line-height: 1;
}

.macro-card strong span {
  font-size: 0.95rem;
  margin-left: 0.25rem;
}

.macro-card.warm { background: linear-gradient(145deg, #ef8354, #d94f3d); }
.macro-card.green { background: linear-gradient(145deg, #4fb286, #2f7f68); }
.macro-card.amber { background: linear-gradient(145deg, #f4b942, #d28c16); }
.macro-card.rose { background: linear-gradient(145deg, #de6b91, #a84f72); }

.detail-card,
.items-card {
  margin-top: 0.85rem;
  padding: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.7rem 0;
  color: rgba(255, 255, 255, 0.78);
}

.detail-row + .detail-row {
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.primary-cta {
  background: linear-gradient(135deg, #ffd166 0%, #ef8354 100%);
  color: #16110d;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

.count-pill {
  min-width: 2.2rem;
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  text-align: center;
  background: rgba(255, 255, 255, 0.08);
}

.items-list {
  display: grid;
  gap: 0.75rem;
}

.item-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.85rem;
  padding: 0.95rem;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.04);
}

.item-image {
  width: 4.25rem;
  height: 4.25rem;
  border-radius: 16px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.08);
}

.item-copy {
  display: grid;
  gap: 0.2rem;
}

.item-copy span,
.item-copy small {
  color: rgba(255, 255, 255, 0.68);
}

.item-macros {
  grid-column: 2;
  display: flex;
  gap: 0.7rem;
  color: rgba(255, 255, 255, 0.74);
  font-size: 0.9rem;
}

.item-actions {
  grid-column: 2;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-left: auto;
}

.item-actions button,
.sheet-actions button,
.sheet label input {
  font: inherit;
}

.icon-action {
  border: none;
  width: 2.9rem;
  height: 2.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.danger-icon-btn {
  color: #ff9e9e;
  background: rgba(255, 95, 95, 0.12);
}

.empty-card {
  padding: 1rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  text-align: center;
}

.empty-card p {
  margin: 0;
}

.empty-card small {
  display: block;
  margin-top: 0.35rem;
  color: rgba(255, 255, 255, 0.66);
}

.dashboard-skeleton {
  pointer-events: none;
}

.skeleton-card,
.skeleton-block,
.skeleton-line,
.skeleton-pill,
.skeleton-item-card {
  position: relative;
  overflow: hidden;
}

.skeleton-card,
.skeleton-item-card,
.skeleton-pill,
.skeleton-block,
.skeleton-line {
  background: rgba(255, 255, 255, 0.08);
}

.skeleton-card.macro {
  min-height: 0;
}

.skeleton-line {
  border-radius: 999px;
}

.skeleton-line.short {
  width: 36%;
  height: 0.72rem;
}

.skeleton-line.medium {
  width: 62%;
  height: 0.8rem;
}

.skeleton-line.tall {
  width: 52%;
  height: 1.85rem;
  margin-top: 0.95rem;
}

.skeleton-block {
  min-height: 3.4rem;
}

.skeleton-pill {
  width: 2.4rem;
  min-height: 2rem;
}

.section-copy {
  display: grid;
  gap: 0.4rem;
}

.skeleton-item-card .item-image {
  min-height: 4.25rem;
}

.skeleton-item-card .item-copy {
  align-content: center;
}

.skeleton-card::after,
.skeleton-block::after,
.skeleton-line::after,
.skeleton-pill::after,
.skeleton-item-card::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.16), transparent);
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}

.sheet-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.55);
  z-index: 70;
}

.sheet {
  width: 100%;
  padding: 1.25rem 1rem calc(env(safe-area-inset-bottom, 0px) + 1rem);
  background: #17151c;
  border-radius: 28px 28px 0 0;
}

.sheet-transition-enter-active,
.sheet-transition-leave-active {
  transition: opacity 0.24s ease;
}

.sheet-transition-enter-active .sheet,
.sheet-transition-leave-active .sheet {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.24s ease;
}

.sheet-transition-enter-from,
.sheet-transition-leave-to {
  opacity: 0;
}

.sheet-transition-enter-from .sheet,
.sheet-transition-leave-to .sheet {
  transform: translateY(1.5rem);
  opacity: 0;
}

.sheet label {
  display: grid;
  gap: 0.45rem;
  margin-top: 1rem;
}

.sheet label span {
  color: rgba(255, 255, 255, 0.72);
}

.sheet label input {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  padding: 1rem;
}

.sheet label input:focus {
  outline: none;
  border-color: rgba(255, 209, 102, 0.7);
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

.sheet-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.sheet-actions button {
  flex: 1;
  border: none;
  border-radius: 18px;
  padding: 0.95rem 1rem;
}

.sheet-actions .ghost {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.sheet-actions .save {
  background: linear-gradient(135deg, #ffd166 0%, #ef8354 100%);
  color: #16110d;
}

@keyframes skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>
