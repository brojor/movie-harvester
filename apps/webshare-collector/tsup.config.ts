import { defineConfig } from 'tsup'
import { baseConfig } from '../../tsup.config.base.js'

export default defineConfig({
  ...baseConfig,
  noExternal: ['@repo/database', '@repo/media-service', '@repo/queues', '@repo/shared', '@repo/types', '@repo/warforum-scraper'],
  banner: {
    js: `import { createRequire as makeRequire } from 'module'; const require = makeRequire(import.meta.url);`,
  },
})
