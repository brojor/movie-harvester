import process from 'node:process'
import * as dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  WEBSHARE_USERNAME: z.string(),
  WEBSHARE_PASSWORD: z.string(),
  WEBSHARE_DOWNLOAD_DIR: z.string().default('./webshare-downloads'),
})

export const env = envSchema.parse(process.env)
