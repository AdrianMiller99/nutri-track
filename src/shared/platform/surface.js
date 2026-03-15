import { computed } from 'vue'
import { Capacitor } from '@capacitor/core'

export const SURFACE_WEB = 'web'
export const SURFACE_MOBILE = 'mobile'

export function getCurrentSurface() {
  return Capacitor.isNativePlatform() ? SURFACE_MOBILE : SURFACE_WEB
}

export function useSurface() {
  const surface = computed(() => getCurrentSurface())

  return {
    surface,
    isWebSurface: computed(() => surface.value === SURFACE_WEB),
    isMobileSurface: computed(() => surface.value === SURFACE_MOBILE),
  }
}
