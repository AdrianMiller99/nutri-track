<template>
  <div class="dashboard">
    <!-- Animated Background -->
    <div class="background">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
    </div>

    <div class="dashboard-content">
      <!-- Header with Day Switcher -->
      <div class="day-switcher glass-card">
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
      <div v-if="dayStore.loading" class="loading-state glass-card">
        <p>Loading your day...</p>
      </div>

      <!-- Main Content -->
      <div v-else class="content">
        <!-- Nutrition Totals -->
        <div class="totals-section glass-card">
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
        <div class="items-section glass-card">
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
        <div class="modal-content glass-card" @click.stop>
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
  min-height: 100vh;
  background: #0a0a0a;
  position: relative;
  overflow: hidden;
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
  width: 600px;
  height: 600px;
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  top: -300px;
  right: -300px;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  bottom: -250px;
  left: -250px;
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

.dashboard-content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Glass Card Effect */
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;
}

.glass-card:hover {
  transform: translateY(-2px);
}

/* Day Switcher */
.day-switcher {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding: 1.5rem;
}

.date-display {
  text-align: center;
}

.date-display h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-btn, .today-btn {
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

.nav-btn:hover, .today-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.today-btn {
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

/* Totals Section */
.totals-section {
  padding: 2rem;
  margin-bottom: 1.5rem;
}

.totals-section h3 {
  margin: 0 0 1.5rem 0;
  color: white;
  font-size: 1.5rem;
}

.macro-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.macro-card {
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  color: white;
  transition: transform 0.2s;
}

.macro-card:hover {
  transform: translateY(-5px);
}

.macro-card.calories { 
  background: linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%);
}
.macro-card.protein { 
  background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%);
}
.macro-card.carbs { 
  background: linear-gradient(135deg, #FFE66D 0%, #FFCA28 100%);
  color: #333;
}
.macro-card.fat { 
  background: linear-gradient(135deg, #95E1D3 0%, #80DEEA 100%);
  color: #333;
}

.macro-value {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.macro-label {
  font-size: 0.875rem;
  opacity: 0.9;
  font-weight: 500;
}

.additional-nutrients {
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.nutrient-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
}

.nutrient-row:last-child {
  border-bottom: none;
}

.toggle-additional {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.2s;
}

.toggle-additional:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* Action Section */
.action-section {
  margin-bottom: 1.5rem;
}

.add-food-btn {
  width: 100%;
  padding: 1.25rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 700;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.add-food-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

/* Items Section */
.items-section {
  padding: 2rem;
}

.items-section h3 {
  margin: 0 0 1.5rem 0;
  color: white;
  font-size: 1.5rem;
}

.item-count {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
  font-weight: normal;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: rgba(255, 255, 255, 0.7);
}

.empty-state .hint {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
  margin-top: 0.5rem;
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
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  transition: all 0.2s;
}

.item-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateX(5px);
}

.item-image {
  width: 60px;
  height: 60px;
  object-fit: contain;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
}

.item-info {
  flex: 1;
}

.item-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  color: white;
}

.item-brand {
  margin: 0 0 0.25rem 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
}

.item-serving {
  margin: 0;
  color: rgba(255, 255, 255, 0.5);
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
  font-size: 1rem;
  color: white;
}

.nutrient span {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
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
  transition: all 0.2s;
}

.edit-btn:hover, .delete-btn:hover {
  opacity: 1;
  transform: scale(1.2);
}

/* Loading & Error States */
.loading-state, .loading-items {
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.7);
}

.error-banner {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(244, 67, 54, 0.9);
  backdrop-filter: blur(10px);
  color: white;
  padding: 1rem 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(244, 67, 54, 0.4);
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 1000;
}

.error-banner button {
  background: transparent;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.error-banner button:hover {
  opacity: 1;
}

/* Edit Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  max-width: 400px;
  width: 100%;
  padding: 2rem;
}

.modal-content h3 {
  margin: 0 0 1rem 0;
  color: white;
}

.modal-product {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1.5rem;
}

.modal-content label {
  display: block;
  margin-bottom: 1rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.modal-content input {
  width: 100%;
  padding: 0.75rem;
  margin-top: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 1rem;
  color: white;
}

.modal-content input:focus {
  outline: none;
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.08);
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
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
}

.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-content {
    padding: 1rem;
  }

  .day-switcher {
    flex-direction: column;
    gap: 1rem;
  }

  .date-display h2 {
    font-size: 1.25rem;
  }

  .macro-cards {
    grid-template-columns: 1fr 1fr;
  }

  .item-card {
    flex-direction: column;
    text-align: center;
  }

  .item-nutrients {
    justify-content: center;
  }
}
</style>
