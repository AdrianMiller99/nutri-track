import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getInitialLocale } from '@/i18n'
import i18n from '@/i18n'
import FoodSearch from '@/views/FoodSearch.vue'

const supportedLocales = ['en', 'de']

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    // Always scroll to top when navigating
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  },
  routes: [
    {
      path: '/:locale',
      component: () => import('@/views/LocaleWrapper.vue'),
      beforeEnter: (to, from, next) => {
        const locale = to.params.locale
        if (!supportedLocales.includes(locale)) {
          // Invalid locale, redirect to detected locale
          const detectedLocale = getInitialLocale()
          return next(`/${detectedLocale}${to.path}`)
        }
        next()
      },
      children: [
        {
          path: '',
          component: () => import('@/views/Home.vue'),
        },
        {
          path: 'auth',
          component: () => import('@/views/Auth.vue'),
        },
        {
          path: 'auth/reset-password',
          component: () => import('@/views/ResetPassword.vue'),
        },
        {
          path: 'app/dashboard',
          component: () => import('@/views/Dashboard.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'app/search',
          name: 'FoodSearch',
          component: FoodSearch,
          meta: { requiresAuth: true }
        },
        {
          path: 'app/lists',
          component: () => import('@/views/Lists.vue'),
          meta: { requiresAuth: true },
        }
      ]
    },
    {
      // Redirect root to detected locale
      path: '/',
      redirect: () => {
        return `/${getInitialLocale()}`
      }
    },
    {
      // Catch-all redirect to add locale prefix
      path: '/:pathMatch(.*)*',
      redirect: (to) => {
        const locale = getInitialLocale()
        return `/${locale}${to.path}`
      }
    }
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const locale = to.params.locale || getInitialLocale()
  const isResetPasswordRoute = to.path.endsWith('/auth/reset-password')
  const isAuthEntryRoute = to.path.endsWith('/auth')
  const isLocaleHomeRoute = to.path === `/${locale}`

  return auth.ensureInitialized().then(() => {
    // Update i18n locale based on URL
    if (to.params.locale && supportedLocales.includes(to.params.locale)) {
      if (i18n.global.locale.value !== to.params.locale) {
        i18n.global.locale.value = to.params.locale
      }
    }

    // Redirect to auth if route requires authentication and user is not logged in
    if (to.meta.requiresAuth && !auth.user) {
      return `/${locale}/auth`
    }

    // Allow password reset for both request and recovery states.
    if (isResetPasswordRoute) {
      return true
    }

    if (auth.user && (isAuthEntryRoute || isLocaleHomeRoute)) {
      return `/${locale}/app/dashboard`
    }

    return true
  })
})

export default router
