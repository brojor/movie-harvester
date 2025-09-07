import { createWebshareDownloader } from '@repo/webshare-downloader'
import { Worker } from 'bullmq'
import { env } from './env.js'

const connection = { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD }
const webshareDownloader = createWebshareDownloader({
  username: env.WEBSHARE_USERNAME,
  password: env.WEBSHARE_PASSWORD,
  downloadDir: env.WEBSHARE_DOWNLOAD_DIR,
})

const _downloadWorker = new Worker(
  'download',
  async (job) => {
    const { url } = job.data as { url: string }
    await webshareDownloader.downloadFile(url)
    return { success: true }
  },
  { connection, prefix: 'webshare', concurrency: 10 },
)
