<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

onMounted(async () => {
  // Initialize auth state
  await authStore.init()
})

async function logout() {
  await authStore.signOut()
  router.push('/auth')
}
</script>

<template>
  <div id="app">
    <!-- Navigation Bar (only show when logged in and not on landing/auth) -->
    <nav v-if="authStore.user && route.path !== '/' && route.path !== '/auth'" class="navbar">
      <div class="nav-container">
        <h1 class="logo">🍎 NutriTrack</h1>
        
        <div class="nav-links">
          <router-link to="/app/dashboard" class="nav-link">
            📊 Dashboard
          </router-link>
          <router-link to="/app/search" class="nav-link">
            🔍 Search
          </router-link>
        </div>

        <div class="nav-actions">
          <span class="user-email">{{ authStore.user.email }}</span>
          <button @click="logout" class="logout-btn">Logout</button>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main :class="{ 'with-nav': authStore.user && route.path !== '/' && route.path !== '/auth' }">
      <router-view />
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #0a0a0a;
  color: #ffffff;
}

#app {
  min-height: 100vh;
}

/* Navigation */
.navbar {
  background: rgba(15, 15, 15, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.logo {
  font-size: 1.5rem;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
}

.nav-links {
  display: flex;
  gap: 1rem;
  flex: 1;
}

.nav-link {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s;
  font-weight: 500;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.95);
}

.nav-link.router-link-active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-email {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background: rgba(244, 67, 54, 0.8);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: rgba(211, 47, 47, 1);
  transform: translateY(-1px);
}

/* Main Content */
main {
  min-height: calc(100vh - 80px);
}

main.with-nav {
  padding-top: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .nav-container {
    flex-wrap: wrap;
    padding: 1rem;
  }

  .user-email {
    display: none;
  }

  .nav-links {
    order: 3;
    width: 100%;
    justify-content: center;
  }
}
</style>
