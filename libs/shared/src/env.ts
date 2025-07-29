/* eslint-disable node/prefer-global/process -- avoid ESM redeclaration in Nuxt */
import { dirname, resolve } from 'node:path'
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
  HTTP_CLIENT_DELAY_MIN: z.coerce.number().default(10000),
  HTTP_CLIENT_DELAY_MAX: z.coerce.number().default(20000),
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string(),
  META_RESOLVER_PORT: z.coerce.number().default(3000),
  WEBSHARE_USERNAME: z.string(),
  WEBSHARE_PASSWORD: z.string(),
  WEBSHARE_DOWNLOAD_DIR: z.string().default(resolve(process.cwd(), 'webshare-downloads')),
})

export const env = envSchema.parse(process.env)
