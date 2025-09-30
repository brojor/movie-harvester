import type { ControlCmd, DownloadJobData, DownloadJobResult } from '@repo/queues'
import { ControlBus } from '@repo/queues'
import { DownloadManager } from '@repo/webshare-downloader'
import { DelayedError, Worker } from 'bullmq'
import { env } from './env.js'

const connection = { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD }
const controlBus = new ControlBus(connection)
const activeDownloads = new Map<string, DownloadManager>()

// Inicializace control bus
controlBus.init().then(() => {
  controlBus.onCommand((cmd: ControlCmd) => {
    const mgr = activeDownloads.get(cmd.jobId)
    if (!mgr) {
      console.error('Download manager not found for job:', cmd.jobId)
      return
    }

    if (cmd.type === 'pause') {
      mgr.pause()
    }
    if (cmd.type === 'cancel') {
      mgr.cancel()
      activeDownloads.delete(cmd.jobId)
    }
  })
})

// BullMQ worker
const _downloadWorker = new Worker<DownloadJobData, DownloadJobResult>(
  'download',
  async (job, token) => {
    const { url } = job.data
    const manager = new DownloadManager({
      onProgress: async p => await job.updateProgress(p),
      updateData: async data => await job.updateData(data),
      username: env.WEBSHARE_USERNAME,
      password: env.WEBSHARE_PASSWORD,
      downloadDir: env.WEBSHARE_DOWNLOAD_DIR,
    })

    activeDownloads.set(job.id!, manager)

    try {
      const { status } = await manager.start(url, job.id!)

      if (status === 'paused') {
        await job.moveToDelayed(Infinity, token)
        throw new DelayedError('Paused')
      }

      if (status === 'finished') {
        activeDownloads.delete(job.id!)
      }

      return { success: true, status }
    }
    catch (error) {
      if (!(error instanceof DelayedError)) {
        console.error('Error downloading file:', error)
      }
      throw error
    }
  },
  { connection, prefix: 'webshare', concurrency: 10 },
)
