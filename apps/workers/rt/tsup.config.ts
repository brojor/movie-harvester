import { defineConfig } from 'tsup'
import { baseConfig } from '../../../tsup.config.base.js'

export default defineConfig({
  ...baseConfig,
  noExternal: ['@repo/database', '@repo/rt-scraper', '@repo/shared', '@repo/types', '@repo/queues', 'bullmq'],
  banner: {
    js: `import { createRequire as makeRequire } from 'module'; const require = makeRequire(import.meta.url);`,
  },
})
