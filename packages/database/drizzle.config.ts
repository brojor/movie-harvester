import { defineConfig } from 'drizzle-kit'
// eslint-disable-next-line antfu/no-import-dist
import { env } from '../shared/dist/index.js'

export default defineConfig({
  schema: './dist/db/schema/*.js',
  dialect: 'sqlite',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
})
