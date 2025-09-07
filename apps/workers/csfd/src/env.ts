import process from 'node:process'
import * as dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string(),

  // Warforum
  WARFORUM_BASE_URL: z.string().url(),
  WARFORUM_SID: z.string(),
  WARFORUM_USER_ID: z.coerce.number(),
  WARFORUM_AUTO_LOGIN_ID: z.string(),

  // Deprecation
  DEPRECATION_DATE: z.string().date(),
})

export const env = envSchema.parse(process.env)

export const redisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
}

export const warforumAgentOpts = {
  baseUrl: env.WARFORUM_BASE_URL,
  sid: env.WARFORUM_SID,
  userId: env.WARFORUM_USER_ID,
  autoLoginId: env.WARFORUM_AUTO_LOGIN_ID,
}

export const deprecationDate = env.DEPRECATION_DATE
export const databaseUrl = env.DATABASE_URL
