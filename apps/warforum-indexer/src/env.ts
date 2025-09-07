import process from 'node:process'
import * as dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string(),
  WARFORUM_BASE_URL: z.string().url(),
  USER_AGENT: z.string(),
  WARFORUM_SID: z.string(),
  WARFORUM_USER_ID: z.coerce.number(),
  WARFORUM_AUTO_LOGIN_ID: z.string(),
  WARFORUM_INDEXER_DEPRECATED_DATE: z.string().date(),
  HTTP_CLIENT_DELAY_MIN: z.coerce.number().default(10000),
  HTTP_CLIENT_DELAY_MAX: z.coerce.number().default(20000),
})

export const env = envSchema.parse(process.env)
