import { defineConfig } from 'tsup'
import { baseConfig } from '../../../tsup.config.base.js'

export default defineConfig({
  ...baseConfig,
  noExternal: ['@repo/csfd-scraper', '@repo/database', '@repo/queues', '@repo/shared', '@repo/types', '@repo/warforum-scraper', 'bullmq'],
  banner: {
    js: `import { createRequire as makeRequire } from 'module'; const require = makeRequire(import.meta.url);`,
  },
})
