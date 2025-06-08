import { defineConfig } from 'drizzle-kit'
// eslint-disable-next-line antfu/no-import-dist
import { env } from '../shared/dist/index.js'

export default defineConfig({
  schema: './src/db/schema',
  dialect: 'sqlite',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
})
