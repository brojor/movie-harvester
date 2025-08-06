import type { ControlCmd, DownloadJobData, DownloadJobResult } from '@repo/queues'
import { controlBus } from '@repo/queues'
import { env } from '@repo/shared'
import { DownloadManager } from '@repo/webshare-downloader'
import { DelayedError, Worker } from 'bullmq'

const connection = { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD }
const activeDownloads = new Map<string, DownloadManager>()

// Inicializace control bus
controlBus.init().then(() => {
  controlBus.onCommand((cmd: ControlCmd) => {
    const mgr = activeDownloads.get(cmd.jobId)
    if (!mgr) {
      console.error('Download manager not found for job:', cmd.jobId)
      return
    }

    if (cmd.type === 'pause')
      mgr.pause()
    if (cmd.type === 'cancel')
      mgr.cancel()
  })
})

// BullMQ worker
const _downloadWorker = new Worker<DownloadJobData, DownloadJobResult>(
  'download',
  async (job) => {
    const { url } = job.data
    const manager = new DownloadManager({
      onProgress: async p => await job.updateProgress(p),
      updateData: async data => await job.updateData(data),
    })

    activeDownloads.set(job.id!, manager)

    try {
      const { status } = await manager.start(url, job.id!)

      if (status === 'paused') {
        await job.moveToDelayed(Infinity)
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
