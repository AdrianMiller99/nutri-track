<template>
  <div class="dashboard">
    <!-- Header with Day Switcher -->
    <div class="day-switcher">
      <button @click="dayStore.previousDay()" class="nav-btn">
        ← Prev
      </button>
      
      <div class="date-display">
        <h2>{{ dayStore.displayDate }}</h2>
        <button v-if="!dayStore.isToday" @click="dayStore.goToToday()" class="today-btn">
          Go to Today
        </button>
      </div>
      
      <button @click="dayStore.nextDay()" class="nav-btn">
        Next →
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="dayStore.loading" class="loading-state">
      <p>Loading your day...</p>
    </div>

    <!-- Main Content -->
    <div v-else class="content">
      <!-- Nutrition Totals -->
      <div class="totals-section">
        <h3>Today's Nutrition</h3>
        
        <div class="macro-cards">
          <div class="macro-card calories">
            <div class="macro-value">{{ Math.round(dayStore.totals.kcal) }}</div>
            <div class="macro-label">Calories</div>
          </div>
          
          <div class="macro-card protein">
            <div class="macro-value">{{ dayStore.totals.protein_g }}g</div>
            <div class="macro-label">Protein</div>
          </div>
          
          <div class="macro-card carbs">
            <div class="macro-value">{{ dayStore.totals.carb_g }}g</div>
            <div class="macro-label">Carbs</div>
          </div>
          
          <div class="macro-card fat">
            <div class="macro-value">{{ dayStore.totals.fat_g }}g</div>
            <div class="macro-label">Fat</div>
          </div>
        </div>

        <!-- Additional Nutrients (Collapsible) -->
        <div class="additional-nutrients" v-if="showAdditional">
          <div class="nutrient-row">
            <span>Fiber</span>
            <span>{{ dayStore.totals.fiber_g }}g</span>
          </div>
          <div class="nutrient-row">
            <span>Sugar</span>
            <span>{{ dayStore.totals.sugar_g }}g</span>
          </div>
          <div class="nutrient-row">
            <span>Sodium</span>
            <span>{{ Math.round(dayStore.totals.sodium_mg) }}mg</span>
          </div>
        </div>
        
        <button @click="showAdditional = !showAdditional" class="toggle-additional">
          {{ showAdditional ? 'Hide' : 'Show' }} Details
        </button>
      </div>

      <!-- Add Food Button -->
      <div class="action-section">
        <button @click="goToSearch" class="add-food-btn">
          + Add Food
        </button>
      </div>

      <!-- Logged Items -->
      <div class="items-section">
        <h3>
          Logged Foods
          <span class="item-count">({{ dayStore.itemCount }})</span>
        </h3>

        <div v-if="dayStore.itemsLoading" class="loading-items">
          Loading items...
        </div>

        <div v-else-if="!dayStore.hasItems" class="empty-state">
          <p>No foods logged yet for this day.</p>
          <p class="hint">Click "Add Food" to get started!</p>
        </div>

        <div v-else class="items-list">
          <div 
            v-for="item in dayStore.items" 
            :key="item.id"
            class="item-card"
          >
            <img 
              v-if="item.image_url" 
              :src="item.image_url" 
              :alt="item.label"
              class="item-image"
            />
            
            <div class="item-info">
              <h4>{{ item.label }}</h4>
              <p class="item-brand" v-if="item.brand">{{ item.brand }}</p>
              <p class="item-serving">{{ item.serving_grams }}g</p>
            </div>

            <div class="item-nutrients">
              <div class="nutrient">
                <strong>{{ Math.round(item.kcal) }}</strong>
                <span>kcal</span>
              </div>
              <div class="nutrient">
                <strong>{{ item.protein_g }}g</strong>
                <span>P</span>
              </div>
              <div class="nutrient">
                <strong>{{ item.carb_g }}g</strong>
                <span>C</span>
              </div>
              <div class="nutrient">
                <strong>{{ item.fat_g }}g</strong>
                <span>F</span>
              </div>
            </div>

            <div class="item-actions">
              <button @click="editItem(item)" class="edit-btn" title="Edit">
                ✏️
              </button>
              <button @click="confirmDelete(item)" class="delete-btn" title="Delete">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="dayStore.error" class="error-banner">
      {{ dayStore.error }}
      <button @click="dayStore.error = null">×</button>
    </div>

    <!-- Edit Modal -->
    <div v-if="editingItem" class="modal" @click="closeEdit">
      <div class="modal-content" @click.stop>
        <h3>Edit Serving Size</h3>
        <p class="modal-product">{{ editingItem.label }}</p>
        
        <label>
          Serving size (grams):
          <input
            v-model.number="editServingGrams"
            type="number"
            min="1"
            step="1"
          />
        </label>

        <div class="modal-actions">
          <button @click="saveEdit" class="save-btn">Save</button>
          <button @click="closeEdit" class="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDayStore } from '@/stores/day'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const dayStore = useDayStore()
const authStore = useAuthStore()

const showAdditional = ref(false)
const editingItem = ref(null)
const editServingGrams = ref(0)

onMounted(async () => {
  // Redirect if not logged in
  if (!authStore.user) {
    router.push('/auth')
    return
  }

  // Load today's entry
  await dayStore.loadEntry()
})

function goToSearch() {
  router.push('/app/search')
}

function editItem(item) {
  editingItem.value = item
  editServingGrams.value = item.serving_grams
}

function closeEdit() {
  editingItem.value = null
  editServingGrams.value = 0
}

async function saveEdit() {
  if (!editingItem.value || editServingGrams.value <= 0) return

  try {
    await dayStore.updateItemServing(editingItem.value.id, editServingGrams.value)
    closeEdit()
  } catch (error) {
    alert('Failed to update: ' + error.message)
  }
}

async function confirmDelete(item) {
  if (!confirm(`Delete ${item.label}?`)) return

  try {
    await dayStore.deleteItem(item.id)
  } catch (error) {
    alert('Failed to delete: ' + error.message)
  }
}
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

/* Day Switcher */
.day-switcher {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.date-display {
  text-align: center;
}

.date-display h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  color: #333;
}

.nav-btn {
  padding: 0.75rem 1.5rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}

.nav-btn:hover {
  background: #45a049;
}

.today-btn {
  padding: 0.5rem 1rem;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
}

/* Totals Section */
.totals-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 1.5rem;
}

.totals-section h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.macro-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.macro-card {
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  color: white;
}

.macro-card.calories { background: #FF6B6B; }
.macro-card.protein { background: #4ECDC4; }
.macro-card.carbs { background: #FFE66D; color: #333; }
.macro-card.fat { background: #95E1D3; color: #333; }

.macro-value {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.macro-label {
  font-size: 0.875rem;
  opacity: 0.9;
}

.additional-nutrients {
  margin: 1rem 0;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.nutrient-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e0e0e0;
}

.nutrient-row:last-child {
  border-bottom: none;
}

.toggle-additional {
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
}

/* Action Section */
.action-section {
  margin-bottom: 1.5rem;
}

.add-food-btn {
  width: 100%;
  padding: 1rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
}

.add-food-btn:hover {
  background: #45a049;
}

/* Items Section */
.items-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.items-section h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.item-count {
  color: #666;
  font-size: 0.875rem;
  font-weight: normal;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.empty-state .hint {
  color: #999;
  font-size: 0.875rem;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.item-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: box-shadow 0.2s;
}

.item-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.item-image {
  width: 60px;
  height: 60px;
  object-fit: contain;
  border-radius: 4px;
}

.item-info {
  flex: 1;
}

.item-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  color: #333;
}

.item-brand {
  margin: 0 0 0.25rem 0;
  color: #666;
  font-size: 0.875rem;
}

.item-serving {
  margin: 0;
  color: #999;
  font-size: 0.875rem;
}

.item-nutrients {
  display: flex;
  gap: 1rem;
}

.nutrient {
  text-align: center;
}

.nutrient strong {
  display: block;
  font-size: 0.95rem;
}

.nutrient span {
  font-size: 0.75rem;
  color: #666;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn, .delete-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.edit-btn:hover, .delete-btn:hover {
  opacity: 1;
}

/* Loading & Error States */
.loading-state, .loading-items {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error-banner {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: #f44336;
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.error-banner button {
  background: transparent;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
}

/* Edit Modal */
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
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
}

.modal-content h3 {
  margin: 0 0 1rem 0;
}

.modal-product {
  color: #666;
  margin-bottom: 1.5rem;
}

.modal-content label {
  display: block;
  margin-bottom: 1rem;
}

.modal-content input {
  width: 100%;
  padding: 0.75rem;
  margin-top: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.modal-actions button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
}

.save-btn {
  background: #4CAF50;
  color: white;
}

.cancel-btn {
  background: #f5f5f5;
  color: #333;
}
</style>

