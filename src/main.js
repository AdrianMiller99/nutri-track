import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { setupNativeAuthRedirects } from './shared/platform/nativeAuthRedirects'

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(i18n)
app.use(router)

app.mount('#app')

void setupNativeAuthRedirects(router, pinia)
