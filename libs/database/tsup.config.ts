import { defineConfig } from 'tsup'
import { baseConfig } from '../../tsup.config.base.js'

export default defineConfig({
  ...baseConfig,
  entry: {
    'index': './src/index.ts',
    'schema/common': './src/schemas/common.ts',
    'schema/movies': './src/schemas/movies.ts',
    'schema/tv-shows': './src/schemas/tv-shows.ts',
  },
  splitting: false,
})
