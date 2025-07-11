import { defineConfig } from 'tsup'
import { baseConfig } from '../../../tsup.config.base.js'

export default defineConfig({
  ...baseConfig,
  noExternal: ['@repo/webshare-downloader', '@repo/shared', 'bullmq'],
  banner: {
    js: `import { createRequire as aTqjs5 } from 'module'; const require = aTqjs5(import.meta.url);`,
  },
})
