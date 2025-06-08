import { env } from '@repo/shared/env'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './dist/*.js',
  dialect: 'sqlite',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
})
