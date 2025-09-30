// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@unocss/nuxt', '@vueuse/nuxt', '@pinia/nuxt'],
  nitro: {
    preset: 'node-server',
    experimental: {
      websocket: true,
    },
    routeRules: {
      '/api/downloads/stream': {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      },
    },
    timing: false, // Disable timing for SSE endpoints
  },
  eslint: {
    config: {
      standalone: false,
    },
  },
  css: ['@unocss/reset/tailwind.css'],
  runtimeConfig: {
    public: {
      wssHost: 'localhost:3000',
    },
  },
})
