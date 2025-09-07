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
})

const env = envSchema.parse(process.env)

export const redisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
}

export const databaseUrl = env.DATABASE_URL

export const tmdbConfig = {
  baseUrl: env.TMDB_BASE_URL,
  apiKey: env.TMDB_API_KEY,
}
