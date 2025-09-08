// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@unocss/nuxt', '@vueuse/nuxt'],
  nitro: {
    preset: 'node-server',
    experimental: {
      websocket: true,
    },
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
