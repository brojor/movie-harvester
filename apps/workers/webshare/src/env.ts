import { resolve } from 'node:path'
import process from 'node:process'
import * as dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  WEBSHARE_USERNAME: z.string(),
  WEBSHARE_PASSWORD: z.string(),
  WEBSHARE_DOWNLOAD_DIR: z.string().default(resolve(process.cwd(), 'webshare-downloads')),
})

export const env = envSchema.parse(process.env)
