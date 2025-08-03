import { env } from '@repo/shared'
import { DownloadManager } from '@repo/webshare-downloader'
import { Worker } from 'bullmq'
import ipc from 'node-ipc'

const connection = { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD }
const activeDownloads = new Map<string, DownloadManager>()

// BullMQ worker
const _downloadWorker = new Worker(
  'download',
  async (job) => {
    const { url } = job.data as { url: string }
    const manager = new DownloadManager()

    activeDownloads.set(job.id as string, manager)
    try {
      await manager.start(url)
      return { success: true }
    }
    finally {
      activeDownloads.delete(job.id as string)
    }
  },
  { connection, prefix: 'webshare', concurrency: 10 },
)

// IPC server
ipc.config.id = 'worker'
ipc.config.silent = true

ipc.serve(() => {
  // Event pro pauzu
  ipc.server.on('pause', (raw: string) => {
    console.log('Received pause event')
    const { jobId } = JSON.parse(raw)
    console.log('Job ID:', jobId)
    const m = activeDownloads.get(jobId)
    if (m) {
      m.pause()
      console.log(`Job ${jobId} pauznut.`)
    }
    else {
      console.log(`Job ${jobId} není aktivní.`)
    }
  })

  // Event pro resume
  ipc.server.on('resume', async (raw: string) => {
    console.log('Received resume event')
    const { jobId } = JSON.parse(raw)
    console.log('Job ID:', jobId)
    const m = activeDownloads.get(jobId)
    if (m) {
      await m.resume()
      console.log(`Job ${jobId} obnoven.`)
    }
    else {
      console.log(`Job ${jobId} není aktivní.`)
    }
  })
})

ipc.server.start()
console.log('Worker spuštěn a čeká na joby...')
