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
  HTTP_CLIENT_DELAY_MIN: z.coerce.number().default(800),
  HTTP_CLIENT_DELAY_MAX: z.coerce.number().default(3000),
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string(),
  META_RESOLVER_PORT: z.coerce.number().default(3000),
})

export const env = envSchema.parse(process.env)
