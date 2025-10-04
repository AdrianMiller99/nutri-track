import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import FoodSearch from '@/views/FoodSearch.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/views/Home.vue'),
    },
    {
      path: '/auth',
      component: () => import('@/views/Auth.vue'),
    },
    {
      path: '/app/dashboard',
      component: () => import('@/views/Dashboard.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/app/search',
      name: 'FoodSearch',
      component: FoodSearch,
      meta: { requiresAuth: true }
    }
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  
  // Redirect to auth if route requires authentication and user is not logged in
  if (to.meta.requiresAuth && !auth.user) {
    return '/auth'
  }
  
  // Redirect to dashboard if logged in user visits landing or auth page
  if ((to.path === '/' || to.path === '/auth') && auth.user) {
    return '/app/dashboard'
  }
})

export default router
