import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import de from './locales/de.json'

const messages = {
  en,
  de
}

// Detect browser language
function getBrowserLocale() {
  const navigatorLocale =
    navigator.languages !== undefined
      ? navigator.languages[0]
      : navigator.language

  if (!navigatorLocale) {
    return 'en'
  }

  // Extract language code (e.g., 'de-DE' -> 'de')
  const locale = navigatorLocale.trim().split(/[-_]/)[0]
  
  // Return if supported, otherwise default to English
  return ['en', 'de'].includes(locale) ? locale : 'en'
}

// Get locale from URL or browser
export function getInitialLocale() {
  // Check URL first (e.g., /de/app/search)
  const pathSegments = window.location.pathname.split('/').filter(Boolean)
  const urlLocale = pathSegments[0]
  
  if (['en', 'de'].includes(urlLocale)) {
    return urlLocale
  }
  
  // Fall back to browser language
  return getBrowserLocale()
}

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  messages,
  globalInjection: true
})

export default i18n

