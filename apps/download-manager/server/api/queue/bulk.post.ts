import type { BulkJobPayload } from '../../../types'
import process from 'node:process'
import { FlowProducer } from '@repo/queues'
import { z } from 'zod'

const envSchema = z.object({
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string(),
})

const env = envSchema.parse(process.env)

const flowProducer = new FlowProducer({
  connection: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  },
  prefix: 'webshare',
})

export default defineEventHandler(async (event) => {
  const { urls, name } = await readBody<BulkJobPayload>(event)

  const children = urls.map((url) => {
    return {
      name: url.split('/').pop() ?? 'Unknown',
      data: { url },
      queueName: 'download',
    }
  })

  // await downloadQueue.addBulk(bulkJobs)
  const jobNode = await flowProducer.add({
    name,
    queueName: 'bundle-download',
    children,
  })

  return jobNode
})
