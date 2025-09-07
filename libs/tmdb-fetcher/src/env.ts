import process from 'node:process'
import * as dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  TMDB_BASE_URL: z.string().url(),
  TMDB_API_KEY: z.string(),
  USER_AGENT: z.string(),
  HTTP_CLIENT_DELAY_MIN: z.coerce.number().default(10000),
  HTTP_CLIENT_DELAY_MAX: z.coerce.number().default(20000),
})

export const env = envSchema.parse(process.env)
