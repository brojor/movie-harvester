import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import * as dotenv from 'dotenv'
import { z } from 'zod'

const envPath = process.env.ENV_FILE || resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env')
dotenv.config({ path: envPath })

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  WARFORUM_BASE_URL: z.string().url(),
  TMDB_BASE_URL: z.string().url(),
  TMDB_API_KEY: z.string(),
  USER_AGENT: z.string(),
  WARFORUM_SID: z.string(),
  WARFORUM_USER_ID: z.coerce.number(),
  WARFORUM_AUTO_LOGIN_ID: z.string(),
  WARFORUM_INDEXER_DEPRECATED_DATE: z.string().date(),
})

export const env = envSchema.parse(process.env)
