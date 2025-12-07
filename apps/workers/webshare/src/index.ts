import type { ControlCmd, DownloadJobData, DownloadJobResult } from '@repo/queues'
import fs from 'node:fs'
import path from 'node:path'
import { ControlBus } from '@repo/queues'
import { DownloadManager } from '@repo/webshare-downloader'
import { DelayedError, Worker } from 'bullmq'
import { ThrottleGroup } from 'stream-throttle'
import { env } from './env.js'

const connection = { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD }
const controlBus = new ControlBus(connection)
const activeDownloads = new Map<string, DownloadManager>()

// Globální throttle skupina sdílená všemi paralelními downloady
const globalThrottle = new ThrottleGroup({ rate: env.WEBSHARE_GLOBAL_RATE_BPS })

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
    const { url, bundleName } = job.data
    console.log('[worker] bundleName:', bundleName)
    const manager = new DownloadManager({
      onProgress: async p => await job.updateProgress(p),
      updateData: async data => await job.updateData(data),
      username: env.WEBSHARE_USERNAME,
      password: env.WEBSHARE_PASSWORD,
      downloadDir: env.WEBSHARE_DOWNLOAD_DIR,
      bundleName,
      throttleGroup: globalThrottle,
    })

    const hb = setInterval(async () => {
      try {
        // pošli poslední známý stav (nebo jen “ping”)
        await job.updateProgress({ status: 'heartbeat' })
      }
      catch {}
    }, 15_000) // každých 15 s

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
    finally {
      clearInterval(hb)
    }
  },
  { connection, prefix: 'webshare', concurrency: env.CONCURRENCY, lockDuration: env.LOCK_DURATION, stalledInterval: env.STALLED_INTERVAL },
)

const __bundleWorker = new Worker(
  'bundle-download',
  async (job) => {
    const bundleName = job.name
    console.log('[worker] bundleName:', bundleName)
    // check, if /mnt/data/<bundleName> exists and is a directory
    if (!fs.statSync(path.join('/mnt/data', bundleName)).isDirectory()) {
      throw new Error(`Bundle ${bundleName} is not a directory`)
    }

    // check, if /mnt/data/<bundleName> has single mkv file
    const files = fs.readdirSync(path.join('/mnt/data', bundleName))
    if (files.length !== 1 || !files[0].endsWith('.mkv')) {
      throw new Error(`Bundle ${bundleName} does not have a single mkv file`)
    }

    // rename the file to <bundleName>.mkv
    console.log('[worker] renaming file to:', path.join('/mnt/data', bundleName, `${bundleName}.mkv`))
    fs.renameSync(path.join('/mnt/data', bundleName, files[0]), path.join('/mnt/data', bundleName, `${bundleName}.mkv`))

    // move folder to /mnt/movies_nfs
    fs.renameSync(path.join('/mnt/data', bundleName), path.join('/mnt/movies_nfs', bundleName))

    return { success: true, status: 'finished' }
  },
  { connection, prefix: 'webshare', concurrency: 1 },
)
