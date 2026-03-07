import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(async ({ command, mode }) => {
  const plugins = [vue()]
  const isCapacitorBuild = mode === 'capacitor'

  if (command === 'serve') {
    const { default: vueDevTools } = await import('vite-plugin-vue-devtools')
    plugins.push(vueDevTools())
  }

  return {
    plugins,
    // GitHub Pages needs the repo path; Capacitor serves the app from root.
    base: isCapacitorBuild ? '/' : command === 'build' ? '/nutri-track/' : '/',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
  }
})
