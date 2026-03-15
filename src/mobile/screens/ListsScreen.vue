<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useDayStore } from '@/stores/day'
import { useListsStore } from '@/stores/lists'
import { useLocaleRoute } from '@/shared/composables/useLocaleRoute'

const { t } = useI18n()
const authStore = useAuthStore()
const dayStore = useDayStore()
const listsStore = useListsStore()
const { localePath, pushLocale, router } = useLocaleRoute()

const showCreateSheet = ref(false)
const newListName = ref('')
const selectedListId = ref(null)
const showBulkAddSheet = ref(false)
const bulkAddMode = ref('today')
const bulkAddDate = ref(dayStore.formatDate(new Date()))
const statusMessage = ref('')
const statusTone = ref('neutral')

const selectedList = computed(() => listsStore.getListById(selectedListId.value))
const isOverlayOpen = computed(() => showCreateSheet.value || Boolean(selectedList.value) || showBulkAddSheet.value)
const todayDate = computed(() => dayStore.formatDate(new Date()))
const chosenBulkAddDate = computed(() => (bulkAddMode.value === 'today' ? todayDate.value : bulkAddDate.value))

watch(
  () => authStore.user?.id,
  (userId) => {
    listsStore.syncWithUser(userId)
  },
  { immediate: true }
)

onMounted(() => {
  if (!authStore.user) {
    pushLocale('/auth')
  }
})

onUnmounted(() => {
  toggleBodyScrollLock(false)
})

watch(selectedList, (list) => {
  if (!list && selectedListId.value) {
    selectedListId.value = null
  }
})

watch(isOverlayOpen, (isOpen) => {
  toggleBodyScrollLock(isOpen)
})

function toggleBodyScrollLock(isLocked) {
  document.documentElement.classList.toggle('mobile-sheet-open', isLocked)
  document.body.classList.toggle('mobile-sheet-open', isLocked)
}

function openCreateSheet() {
  showCreateSheet.value = true
}

function closeCreateSheet() {
  showCreateSheet.value = false
  newListName.value = ''
}

function openList(listId) {
  selectedListId.value = listId
}

function closeListSheet() {
  closeBulkAddSheet()
  selectedListId.value = null
}

function setStatus(message, tone = 'neutral') {
  statusMessage.value = message
  statusTone.value = tone
  window.setTimeout(() => {
    if (statusMessage.value === message) {
      statusMessage.value = ''
    }
  }, 3000)
}

function createList() {
  try {
    const list = listsStore.createList(newListName.value)
    closeCreateSheet()
    openList(list.id)
  } catch (error) {
    window.alert(error.message)
  }
}

function addFoodsToList(listId) {
  router.push({
    path: localePath('/app/search'),
    query: { list: listId },
  })
}

function openBulkAddSheet() {
  bulkAddMode.value = 'today'
  bulkAddDate.value = todayDate.value
  showBulkAddSheet.value = true
}

function closeBulkAddSheet() {
  showBulkAddSheet.value = false
}

async function addListToChosenDay() {
  if (!selectedList.value?.items?.length) {
    return
  }

  if (!chosenBulkAddDate.value) {
    setStatus(t('lists.messages.chooseValidDay'), 'error')
    return
  }

  try {
    const insertedItems = await dayStore.addSavedItemsToDate(selectedList.value.items, chosenBulkAddDate.value)
    const insertedCount = insertedItems.length
    const addedDateLabel = chosenBulkAddDate.value === todayDate.value ? t('dashboard.today') : chosenBulkAddDate.value
    closeBulkAddSheet()
    closeListSheet()
    setStatus(t('lists.messages.addedToDay', { count: insertedCount, date: addedDateLabel }), 'success')
  } catch (error) {
    setStatus(error.message, 'error')
  }
}

function deleteList(list) {
  const confirmed = window.confirm(t('lists.confirmDelete', { name: list.name }))
  if (!confirmed) {
    return
  }

  listsStore.deleteList(list.id)
  if (selectedListId.value === list.id) {
    closeListSheet()
  }
}

function removeItem(listId, itemId) {
  listsStore.removeItemFromList(listId, itemId)
}
</script>

<template>
  <section class="mobile-lists">
    <div class="hero-card">
      <p class="eyebrow">{{ $t('lists.savedCollections') }}</p>
      <h2>{{ $t('lists.hero.title') }}</h2>
      <p class="hero-copy">{{ $t('lists.hero.copy') }}</p>
    </div>

    <p v-if="statusMessage" :class="['status-banner', statusTone]">{{ statusMessage }}</p>

    <section class="lists-panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">{{ $t('lists.yourLists') }}</p>
          <h3>{{ listsStore.lists.length }}</h3>
        </div>
      </div>

      <div v-if="!listsStore.hasLists" class="empty-card">
        <p>{{ $t('lists.empty.title') }}</p>
        <small>{{ $t('lists.empty.copy') }}</small>
      </div>

      <div v-else class="lists-grid">
        <article
          v-for="list in listsStore.lists"
          :key="list.id"
          class="list-card"
          @click="openList(list.id)"
        >
          <div class="list-card-copy">
            <strong>{{ list.name }}</strong>
            <span>{{ $t('lists.itemCount', { count: list.items.length }) }}</span>
          </div>
          <div class="list-card-actions">
            <button class="card-action success-icon-btn" @click.stop="addFoodsToList(list.id)">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M12 5a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1 -2 0v-5h-5a1 1 0 1 1 0 -2h5v-5a1 1 0 0 1 1 -1z" />
              </svg>
              <span>{{ $t('lists.addFoods') }}</span>
            </button>
            <button class="icon-action danger-icon-btn" :aria-label="$t('lists.deleteList')" @click.stop="deleteList(list)">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M9 3a1 1 0 0 0 -.894 .553l-.382 .764l-3.724 .683a1 1 0 0 0 .18 1.984h.82l.724 10.138a3 3 0 0 0 2.992 2.778h6.568a3 3 0 0 0 2.992 -2.778l.724 -10.138h.82a1 1 0 0 0 .18 -1.984l-3.724 -.683l-.382 -.764a1 1 0 0 0 -.894 -.553zm0 2h6l.5 1h-7z" />
              </svg>
            </button>
          </div>
        </article>
      </div>
    </section>

    <button class="floating-create-btn" @click="openCreateSheet">{{ $t('lists.createNew') }}</button>

    <div v-if="showCreateSheet" class="sheet-backdrop" @click="closeCreateSheet">
      <div class="sheet" @click.stop>
        <div class="sheet-header">
          <div>
            <p class="eyebrow">{{ $t('lists.newList') }}</p>
            <h3>{{ $t('lists.nameList') }}</h3>
          </div>
          <button class="close-btn" @click="closeCreateSheet">×</button>
        </div>

        <label class="field-block">
          <span>{{ $t('lists.listName') }}</span>
          <input
            v-model="newListName"
            type="text"
            :placeholder="$t('lists.placeholders.name')"
            @keyup.enter="createList"
          >
        </label>

        <button class="primary-cta inner create-submit-btn" @click="createList">{{ $t('lists.createList') }}</button>
      </div>
    </div>

    <div v-if="selectedList" class="sheet-backdrop" @click="closeListSheet">
      <div class="sheet detail-sheet" @click.stop>
        <div class="sheet-header">
          <div>
            <p class="eyebrow">{{ $t('lists.details') }}</p>
            <h3>{{ selectedList.name }}</h3>
            <span>{{ $t('lists.savedItemCount', { count: selectedList.items.length }) }}</span>
          </div>
          <button class="close-btn" @click="closeListSheet">×</button>
        </div>

        <div class="detail-actions">
          <button class="primary-cta inner" @click="addFoodsToList(selectedList.id)">{{ $t('lists.addFoodsToList') }}</button>
          <button class="success-btn" :disabled="!selectedList.items.length" @click="openBulkAddSheet">{{ $t('lists.addAllToDay') }}</button>
        </div>

        <div v-if="!selectedList.items.length" class="empty-card detail-empty">
          <p>{{ $t('lists.emptyList.title') }}</p>
          <small>{{ $t('lists.emptyList.copy') }}</small>
        </div>

        <div v-else class="saved-items">
          <article v-for="item in selectedList.items" :key="item.id" class="saved-item-card">
            <img v-if="item.image_url" :src="item.image_url" :alt="item.label" class="saved-item-image">
            <div class="saved-item-copy">
              <strong>{{ item.label }}</strong>
              <span v-if="item.brand">{{ item.brand }}</span>
              <small>{{ item.serving_grams }}g · {{ Math.round(item.kcal) }} kcal</small>
              <small>P {{ item.protein_g }}g · C {{ item.carb_g }}g · F {{ item.fat_g }}g</small>
            </div>
            <button class="icon-action danger-icon-btn" :aria-label="$t('lists.removeItem')" @click="removeItem(selectedList.id, item.id)">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M9 3a1 1 0 0 0 -.894 .553l-.382 .764l-3.724 .683a1 1 0 0 0 .18 1.984h.82l.724 10.138a3 3 0 0 0 2.992 2.778h6.568a3 3 0 0 0 2.992 -2.778l.724 -10.138h.82a1 1 0 0 0 .18 -1.984l-3.724 -.683l-.382 -.764a1 1 0 0 0 -.894 -.553zm0 2h6l.5 1h-7z" />
              </svg>
            </button>
          </article>
        </div>
      </div>
    </div>

    <div v-if="showBulkAddSheet" class="sheet-backdrop nested" @click="closeBulkAddSheet">
      <div class="sheet" @click.stop>
        <div class="sheet-header">
          <div>
            <p class="eyebrow">{{ $t('lists.chooseDay') }}</p>
            <h3>{{ $t('lists.addListToDay', { name: selectedList?.name }) }}</h3>
            <span>{{ $t('lists.willBeAdded', { count: selectedList?.items.length || 0 }) }}</span>
          </div>
          <button class="close-btn" @click="closeBulkAddSheet">×</button>
        </div>

        <div class="mode-toggle">
          <button :class="['mode-btn', { active: bulkAddMode === 'today' }]" @click="bulkAddMode = 'today'">{{ $t('dashboard.today') }}</button>
          <button :class="['mode-btn', { active: bulkAddMode === 'custom' }]" @click="bulkAddMode = 'custom'">{{ $t('lists.pastDay') }}</button>
        </div>

        <label v-if="bulkAddMode === 'custom'" class="field-block">
          <span>{{ $t('lists.selectDate') }}</span>
          <input v-model="bulkAddDate" type="date" :max="todayDate">
        </label>

        <button class="success-btn sheet-submit-btn" @click="addListToChosenDay">
          {{ $t('lists.addAllItemsToDate', { date: bulkAddMode === 'today' ? $t('dashboard.today') : chosenBulkAddDate }) }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.mobile-lists {
  padding: 1rem;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 7rem);
  color: white;
}

.hero-card,
.lists-panel,
.sheet {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(18px);
}

.hero-card,
.lists-panel {
  border-radius: 26px;
  padding: 1rem;
}

.hero-card h2,
.section-heading h3,
.sheet h3 {
  margin: 0;
}

.hero-card h2 {
  margin-top: 0.5rem;
  font-size: 1.5rem;
  line-height: 1.15;
}

.hero-copy {
  margin: 0.75rem 0 0;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.55;
}

.eyebrow,
.field-block span {
  display: block;
  margin: 0;
  color: rgba(255, 214, 138, 0.85);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.lists-panel {
  margin-top: 0.9rem;
}

.status-banner {
  margin: 0.9rem 0 0;
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

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

.empty-card {
  padding: 1rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  text-align: center;
}

.empty-card p,
.empty-card small {
  display: block;
}

.empty-card p {
  margin: 0;
}

.empty-card small {
  margin-top: 0.35rem;
  color: rgba(255, 255, 255, 0.65);
}

.lists-grid,
.saved-items {
  display: grid;
  gap: 0.75rem;
}

.list-card,
.saved-item-card {
  display: grid;
  gap: 0.8rem;
  align-items: center;
  padding: 0.95rem;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.04);
}

.list-card {
  grid-template-columns: 1fr auto;
}

.list-card-actions {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.list-card-copy,
.saved-item-copy {
  display: grid;
  gap: 0.2rem;
}

.list-card-copy span,
.saved-item-copy span,
.saved-item-copy small,
.sheet-header span {
  color: rgba(255, 255, 255, 0.66);
}

.card-action,
.ghost-btn,
.remove-btn,
.primary-cta,
.close-btn,
.success-btn,
.danger-btn,
.floating-create-btn,
.mode-btn,
.icon-action {
  border: none;
  font: inherit;
}

.card-action,
.ghost-btn,
.remove-btn,
.mode-btn {
  border-radius: 18px;
  padding: 0.8rem 0.95rem;
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.card-action {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.primary-cta {
  width: 100%;
  margin-top: 0.9rem;
  border-radius: 20px;
  padding: 1rem;
  background: linear-gradient(135deg, #ffd166 0%, #ef8354 100%);
  color: #16110d;
  font-weight: 700;
}

.primary-cta.inner {
  margin-top: 0;
}

.create-submit-btn {
  margin-top: 1.1rem !important;
}

.sheet-submit-btn {
  margin-top: 1rem;
  width: 100%;
  display: block;
}

.floating-create-btn {
  position: fixed;
  right: 1rem;
  left: 1rem;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 6rem);
  z-index: 30;
  width: auto;
  border-radius: 20px;
  padding: 1rem;
  background: linear-gradient(135deg, #ffd166 0%, #ef8354 100%);
  color: #16110d;
  font-weight: 700;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
}

.success-btn {
  border-radius: 18px;
  padding: 0.95rem 1rem;
  background: linear-gradient(135deg, #7be495 0%, #37b66b 100%);
  color: #0d2215;
  font-weight: 700;
}

.success-btn:disabled {
  opacity: 0.5;
}

.danger-btn {
  border-radius: 18px;
  padding: 0.95rem 1rem;
  background: rgba(255, 95, 95, 0.16);
  color: #ff8f8f;
}

.icon-action {
  flex: 0 0 auto;
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
  background: rgba(255, 95, 95, 0.16);
  color: #ff8f8f;
}

.success-icon-btn {
  background: rgba(80, 200, 120, 0.14);
  color: #9fe1a9;
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
  z-index: 60;
}

.sheet-backdrop.nested {
  z-index: 70;
  background: rgba(0, 0, 0, 0.35);
}

.sheet {
  width: 100%;
  max-height: 86vh;
  overflow: auto;
  padding: 1.25rem 1rem calc(env(safe-area-inset-bottom, 0px) + 1rem);
  border-radius: 28px 28px 0 0;
  background: #17151c;
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
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

.field-block {
  display: grid;
  gap: 0.45rem;
  margin-top: 1rem;
}

input {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  padding: 1rem;
  font: inherit;
}

.detail-actions {
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;
}

.mode-toggle {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-top: 1rem;
}

.mode-btn.active {
  background: rgba(255, 209, 102, 0.16);
  color: #ffd888;
}

.detail-empty {
  margin-top: 1rem;
}

.saved-item-card {
  grid-template-columns: auto 1fr auto;
  margin-top: 0.9rem;
}

.saved-item-image {
  width: 4rem;
  height: 4rem;
  border-radius: 16px;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.4rem;
}

:global(html.mobile-sheet-open),
:global(body.mobile-sheet-open) {
  overflow: hidden;
  overscroll-behavior: none;
}
</style>
