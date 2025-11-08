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

export async function addToQueue(bundleName: string, url: string): Promise<void> {
  await flowProducer.add(
    {
      name: bundleName,
      queueName: 'bundle-download',
      children: [
        {
          name: bundleName,
          data: { url, bundleName },
          queueName: 'download',
          opts: {
            delay: 365 * 24 * 60 * 60 * 1000,
          },
        },
      ],
    },
  )
}
