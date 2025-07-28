import { defineConfig } from 'drizzle-kit'
// eslint-disable-next-line antfu/no-import-dist
import { env } from '../shared/dist/index.js'

export default defineConfig({
  schema: './dist/schema/*.js',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
})
