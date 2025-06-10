import { defineConfig, presetIcons, presetWind3 } from 'unocss'
import { presetScrollbarHide } from 'unocss-preset-scrollbar-hide'

const originalLanguages = ['en', 'fr', 'ko', 'ja', 'cn', 'cs', 'it', 'de', 'no', 'ru', 'xx', 'sk', 'th', 'nl', 'id', 'pl', 'es']

export default defineConfig({
  presets: [
    presetWind3(),
    presetIcons(),
    presetScrollbarHide(),
  ],
  safelist: originalLanguages.map(lang => `i-circle-flags:${lang}`),
})
