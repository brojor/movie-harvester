import { env } from '@repo/shared'
import { Worker } from 'bullmq'

const connection = { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD }

const _downloadWorker = new Worker(
  'download',
  async (job) => {
    const { url } = job.data as { url: string }
    console.log(url)
    return { success: true }
  },
  { connection, prefix: 'webshare' },
)
