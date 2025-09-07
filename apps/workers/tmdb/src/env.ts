import process from 'node:process'
import * as dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string(),
  TMDB_BASE_URL: z.string().url(),
  TMDB_API_KEY: z.string(),
  USER_AGENT: z.string(),
  HTTP_CLIENT_DELAY_MIN: z.coerce.number().default(10000),
  HTTP_CLIENT_DELAY_MAX: z.coerce.number().default(20000),
})

export const env = envSchema.parse(process.env)
