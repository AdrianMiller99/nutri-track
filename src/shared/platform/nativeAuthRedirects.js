import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { parseNativeAuthRedirectUrl } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'

async function handleNativeAuthRedirect(url, router, authStore) {
  const redirect = parseNativeAuthRedirectUrl(url)
  if (!redirect) {
    return
  }

  if (redirect.isRecoveryLink) {
    await authStore.consumeRecoveryLink(url)
  }

  const fullPath = `${redirect.path}${redirect.search}${redirect.hash}`
  if (router.currentRoute.value.fullPath !== fullPath) {
    await router.replace(fullPath)
  }
}

export async function setupNativeAuthRedirects(router, pinia) {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  const authStore = useAuthStore(pinia)
  const launchData = await CapacitorApp.getLaunchUrl()
  if (launchData?.url) {
    await handleNativeAuthRedirect(launchData.url, router, authStore)
  }

  await CapacitorApp.addListener('appUrlOpen', ({ url }) => {
    void handleNativeAuthRedirect(url, router, authStore)
  })
}
