import type { BulkJobPayload } from '../../../types'
import process from 'node:process'
import { createQueues } from '@repo/queues'
import { z } from 'zod'

const envSchema = z.object({
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string(),
})

const env = envSchema.parse(process.env)

const queues = createQueues({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
})

export default defineEventHandler(async (event) => {
  const { urls } = await readBody<BulkJobPayload>(event)
  const bulkJobs = urls.map(url => ({
    name: 'download',
    data: { url },
  }))

  await queues.downloadQueue.addBulk(bulkJobs)
})
