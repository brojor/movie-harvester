import { defineConfig } from 'tsup'
import { baseConfig } from '../../../tsup.config.base.js'

export default defineConfig({
  ...baseConfig,
  noExternal: ['@repo/webshare-downloader', '@repo/shared', 'bullmq'],
  banner: {
    js: `import { createRequire as makeRequire } from 'module'; const require = makeRequire(import.meta.url);`,
  },
})
