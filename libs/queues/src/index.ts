import type { ConnectionOptions } from 'bullmq'
import type { ControlCmd } from './control-bus.js'
import { env } from '@repo/shared'
import { FlowProducer, Queue, QueueEvents } from 'bullmq'
import { ControlBus } from './control-bus.js'

// Define types for download jobs
export interface DownloadJobData {
  url: string
}

export interface DownloadJobResult {
  success: boolean
  status: string
}

const connection: ConnectionOptions = { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD }

export const csfdMovieQueue = new Queue('movies', { connection, prefix: 'csfd' })
export const rtMovieQueue = new Queue('movies', { connection, prefix: 'rt' })
export const tmdbMovieQueue = new Queue('movies', { connection, prefix: 'tmdb' })

export const csfdTvShowQueue = new Queue('tv-shows', { connection, prefix: 'csfd' })
export const rtTvShowQueue = new Queue('tv-shows', { connection, prefix: 'rt' })
export const tmdbTvShowQueue = new Queue('tv-shows', { connection, prefix: 'tmdb' })

export const downloadQueue = new Queue<DownloadJobData, DownloadJobResult>('download', { connection, prefix: 'webshare' })
export const bundleDownloadQueue = new Queue<DownloadJobData, DownloadJobResult>('bundle-download', { connection, prefix: 'webshare' })

export const downloadQueueEvents = new QueueEvents('download', { connection, prefix: 'webshare' })
export const bundleDownloadQueueEvents = new QueueEvents('bundle-download', { connection, prefix: 'webshare' })

export const controlBus = new ControlBus(connection)

export const flowProducer = new FlowProducer({ connection, prefix: 'webshare' })
export type { ControlCmd }
