// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  css: ['@unocss/reset/tailwind.css'],
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/fonts', '@vueuse/nuxt', '@unocss/nuxt'],
  eslint: {
    config: {
      standalone: false,
    },
  },
})
