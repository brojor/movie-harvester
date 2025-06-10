import { defineConfig } from 'tsup'
import { baseConfig } from '../../tsup.config.base.js'

export default defineConfig({
  ...baseConfig,
  entry: {
    'index': './src/index.ts',
    'db/schema/common': './src/db/schema/common.ts',
    'db/schema/movies': './src/db/schema/movies.ts',
    'db/schema/tv-shows': './src/db/schema/tv-shows.ts',
  },
})
