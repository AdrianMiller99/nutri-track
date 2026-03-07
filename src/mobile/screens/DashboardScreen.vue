<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useDayStore } from '@/stores/day'
import { useLocaleRoute } from '@/shared/composables/useLocaleRoute'

const authStore = useAuthStore()
const dayStore = useDayStore()
const { pushLocale } = useLocaleRoute()
const { t } = useI18n()

const editingItem = ref(null)
const editServingGrams = ref(0)

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
}

function closeEdit() {
  editingItem.value = null
  editServingGrams.value = 0
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
</script>

<template>
  <section class="mobile-dashboard">
    <div class="day-strip">
      <button class="day-nav" @click="dayStore.previousDay()">←</button>
      <div class="day-summary">
        <p class="day-eyebrow">{{ dayStore.isToday ? 'Today' : 'Diary day' }}</p>
        <h2>{{ dayStore.displayDate }}</h2>
      </div>
      <button class="day-nav" @click="dayStore.nextDay()">→</button>
    </div>

    <button v-if="!dayStore.isToday" class="today-chip" @click="dayStore.goToToday()">
      {{ $t('dashboard.goToToday') }}
    </button>

    <div v-if="dayStore.loading" class="state-card">{{ $t('dashboard.loadingDay') }}</div>

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
            <p class="section-eyebrow">Logged</p>
            <h3>{{ $t('dashboard.loggedFoods') }}</h3>
          </div>
          <span class="count-pill">{{ dayStore.itemCount }}</span>
        </div>

        <div v-if="dayStore.itemsLoading" class="state-card inner">{{ $t('dashboard.loadingItems') }}</div>
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
              <button @click="startEdit(item)">Edit</button>
              <button class="danger" @click="deleteItem(item)">Delete</button>
            </div>
          </article>
        </div>
      </section>
    </template>

    <div v-if="editingItem" class="sheet-backdrop" @click="closeEdit">
      <div class="sheet" @click.stop>
        <p class="section-eyebrow">Edit serving</p>
        <h3>{{ editingItem.label }}</h3>
        <label>
          <span>Serving grams</span>
          <input v-model.number="editServingGrams" type="number" min="1" step="1">
        </label>
        <div class="sheet-actions">
          <button class="ghost" @click="closeEdit">Cancel</button>
          <button class="save" @click="saveEdit">{{ $t('dashboard.editServing.save') }}</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.mobile-dashboard {
  padding: 1rem;
  color: white;
}

.day-strip,
.items-card,
.detail-card {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 26px;
  backdrop-filter: blur(18px);
}

.day-strip {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.8rem;
}

.day-nav {
  width: 3rem;
  height: 3rem;
  border: none;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  color: white;
  font-size: 1.2rem;
}

.day-eyebrow,
.section-eyebrow {
  margin: 0 0 0.25rem;
  color: rgba(255, 214, 138, 0.85);
  font-size: 0.74rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.day-summary h2,
.section-heading h3,
.sheet h3 {
  margin: 0;
}

.today-chip,
.primary-cta {
  width: 100%;
  border: none;
  border-radius: 20px;
  padding: 1rem;
  margin-top: 0.85rem;
  font: inherit;
  font-weight: 700;
}

.today-chip {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.macro-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 0.85rem;
}

.macro-card {
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
  gap: 0.8rem;
}

.item-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.9rem;
  padding: 0.9rem;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.04);
}

.item-image {
  width: 4rem;
  height: 4rem;
  border-radius: 16px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.06);
}

.item-copy {
  display: grid;
  gap: 0.2rem;
}

.item-copy span,
.item-copy small,
.item-macros {
  color: rgba(255, 255, 255, 0.68);
}

.item-macros {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 0.35rem;
  font-size: 0.88rem;
}

.item-actions {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.75rem;
}

.item-actions button {
  border: none;
  border-radius: 14px;
  padding: 0.75rem 0.95rem;
  background: rgba(255, 255, 255, 0.08);
  color: white;
  font: inherit;
}

.item-actions .danger {
  background: rgba(255, 97, 97, 0.14);
  color: #ffadad;
}

.state-card,
.empty-card {
  padding: 1.1rem;
  text-align: center;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
}

.empty-card small {
  display: block;
  margin-top: 0.45rem;
  color: rgba(255, 255, 255, 0.6);
}

.sheet-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.55);
  z-index: 60;
}

.sheet {
  width: 100%;
  padding: 1.25rem 1rem calc(env(safe-area-inset-bottom, 0px) + 1rem);
  background: #17151c;
  border-radius: 28px 28px 0 0;
}

.sheet label {
  display: grid;
  gap: 0.45rem;
  margin-top: 1rem;
}

.sheet input {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font: inherit;
}

.sheet-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-top: 1rem;
}

.sheet-actions button {
  border: none;
  border-radius: 18px;
  padding: 1rem;
  font: inherit;
  font-weight: 700;
}

.sheet-actions .ghost {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.sheet-actions .save {
  background: #ffffff;
  color: #121212;
}
</style>
