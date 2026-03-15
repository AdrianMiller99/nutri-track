import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function useLocaleRoute() {
  const route = useRoute()
  const router = useRouter()

  const currentLocale = computed(() => route.params.locale || 'en')

  function localePath(path = '') {
    if (!path || path === '/') {
      return `/${currentLocale.value}`
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `/${currentLocale.value}${normalizedPath}`
  }

  function pushLocale(path = '') {
    return router.push(localePath(path))
  }

  return {
    route,
    router,
    currentLocale,
    localePath,
    pushLocale,
  }
}
