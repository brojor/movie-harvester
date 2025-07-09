// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@unocss/nuxt'],
  nitro: {
    preset: 'node-server',
  },
  eslint: {
    config: {
      standalone: false,
    },
  },
  css: ['@unocss/reset/tailwind.css'],
})
