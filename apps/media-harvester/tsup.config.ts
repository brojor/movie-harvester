import { defineConfig } from 'tsup'
import { baseConfig } from '../../tsup.config.base.js'

export default defineConfig({
  ...baseConfig,
  noExternal: [
    '@repo/csfd-scraper',
    '@repo/rt-scraper',
    '@repo/tmdb-fetcher',
    '@repo/warforum-scraper',
  ],
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
})
