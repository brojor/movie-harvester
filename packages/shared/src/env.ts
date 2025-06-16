import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import * as dotenv from 'dotenv'
import { z } from 'zod'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../../../.env') })

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  WARFORUM_BASE_URL: z.string().url(),
  TMDB_BASE_URL: z.string().url(),
  TMDB_API_KEY: z.string(),
  USER_AGENT: z.string(),
  WARFORUM_USER_ID: z.number(),
  WARFORUM_AUTO_LOGIN_ID: z.string(),
})

export const env = envSchema.parse(process.env)
