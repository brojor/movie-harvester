import { resolve } from 'node:path'
import process from 'node:process'
import * as dotenv from 'dotenv'
import { z } from 'zod'

const path = resolve(__dirname, '../.env')
dotenv.config({ path })

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  WARFORUM_BASE_URL: z.string().url(),
  WARFORUM_SID: z.string(),
  TMDB_BASE_URL: z.string().url(),
  TMDB_API_KEY: z.string(),
})

export const env = envSchema.parse(process.env)
