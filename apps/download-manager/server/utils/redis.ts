import process from 'node:process'
import { ControlBus, createQueues, QueueEvents } from '@repo/queues'
import { z } from 'zod'

const envSchema = z.object({
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),
})

const env = envSchema.parse(process.env)

const connection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
}

export const queues = createQueues(connection)
export const controlBus = new ControlBus(connection)
export const downloadQueueEvents = new QueueEvents('download', {
  connection,
  prefix: 'webshare',
})
