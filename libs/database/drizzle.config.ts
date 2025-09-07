import process from 'node:process'
import { defineConfig } from 'drizzle-kit'
import { z } from 'zod'

const envSchema = z.object({
  // DATABASE_URL: z.string().url().default('postgresql://postgres:postgres@localhost:5432/postgres'),
  DATABASE_URL: z.string().url(),
})

const env = envSchema.parse(process.env)

export default defineConfig({
  schema: './dist/schema/*.js',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
})
