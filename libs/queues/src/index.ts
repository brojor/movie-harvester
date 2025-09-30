import type { ConnectionOptions } from 'bullmq'
import type { ControlCmd } from './control-bus.js'
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

export interface RedisConfig {
  host: string
  port: number
  password: string
}

export interface Queues {
  csfdMovieQueue: Queue
  rtMovieQueue: Queue
  tmdbMovieQueue: Queue
  csfdTvShowQueue: Queue
  rtTvShowQueue: Queue
  tmdbTvShowQueue: Queue
  downloadQueue: Queue
  bundleDownloadQueue: Queue
}

export function createQueues(config: RedisConfig): Queues {
  const connection: ConnectionOptions = {
    host: config.host,
    port: config.port,
    password: config.password,
  }

  const csfdMovieQueue = new Queue('movies', { connection, prefix: 'csfd' })
  const rtMovieQueue = new Queue('movies', { connection, prefix: 'rt' })
  const tmdbMovieQueue = new Queue('movies', { connection, prefix: 'tmdb' })

  const csfdTvShowQueue = new Queue('tv-shows', { connection, prefix: 'csfd' })
  const rtTvShowQueue = new Queue('tv-shows', { connection, prefix: 'rt' })
  const tmdbTvShowQueue = new Queue('tv-shows', { connection, prefix: 'tmdb' })

  const downloadQueue = new Queue<DownloadJobData, DownloadJobResult>('download', { connection, prefix: 'webshare' })
  const bundleDownloadQueue = new Queue<DownloadJobData, DownloadJobResult>('bundle-download', { connection, prefix: 'webshare' })

  // These are exported as classes for consumers to instantiate when needed

  return {
    csfdMovieQueue,
    rtMovieQueue,
    tmdbMovieQueue,
    csfdTvShowQueue,
    rtTvShowQueue,
    tmdbTvShowQueue,
    downloadQueue,
    bundleDownloadQueue,
  }
}

export { ControlBus }
export { FlowProducer, Queue, QueueEvents }
export type { ControlCmd }
