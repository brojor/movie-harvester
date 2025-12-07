import { resolve } from 'node:path'
import process from 'node:process'
import * as dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

function clean(v: unknown): unknown {
  return v === '' ? undefined : v
}

const envSchema = z.object({
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.preprocess(clean, z.coerce.number().default(6379)),
  REDIS_PASSWORD: z.string().optional(),
  WEBSHARE_USERNAME: z.string(),
  WEBSHARE_PASSWORD: z.string(),
  WEBSHARE_DOWNLOAD_DIR: z.string().default(resolve(process.cwd(), 'webshare-downloads')),
  LOCK_DURATION: z.preprocess(clean, z.coerce.number().default(30 * 60_000)),
  STALLED_INTERVAL: z.preprocess(clean, z.coerce.number().default(60_000)),
  CONCURRENCY: z.preprocess(clean, z.coerce.number().default(10)),
  // Globální rychlostní limit v B/s (výchozí: 1 MB/s = 1 * 1024 * 1024)
  WEBSHARE_GLOBAL_RATE_BPS: z.preprocess(clean, z.coerce.number().default(1 * 1024 * 1024)),
})

export const env = envSchema.parse(process.env)
