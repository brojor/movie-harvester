import type { ConnectionOptions } from 'bullmq'
import { Queue } from 'bullmq'

export interface RedisConfig {
  host: string
  port: number
  password: string
}

let connection: ConnectionOptions | null = null

export function createQueues(config: RedisConfig): {
  csfdMovieQueue: Queue
  rtMovieQueue: Queue
  tmdbMovieQueue: Queue
  csfdTvShowQueue: Queue
  rtTvShowQueue: Queue
  tmdbTvShowQueue: Queue
  downloadQueue: Queue
} {
  connection = { host: config.host, port: config.port, password: config.password }

  return {
    csfdMovieQueue: new Queue('movies', { connection, prefix: 'csfd' }),
    rtMovieQueue: new Queue('movies', { connection, prefix: 'rt' }),
    tmdbMovieQueue: new Queue('movies', { connection, prefix: 'tmdb' }),
    csfdTvShowQueue: new Queue('tv-shows', { connection, prefix: 'csfd' }),
    rtTvShowQueue: new Queue('tv-shows', { connection, prefix: 'rt' }),
    tmdbTvShowQueue: new Queue('tv-shows', { connection, prefix: 'tmdb' }),
    downloadQueue: new Queue('download', { connection, prefix: 'webshare' }),
  }
}

export function getConnection(): ConnectionOptions {
  if (!connection) {
    throw new Error('Queues not initialized. Call createQueues() first.')
  }
  return connection
}

// Legacy exports for backward compatibility - will be removed
export const csfdMovieQueue = new Queue('movies', { connection: getConnection(), prefix: 'csfd' })
export const rtMovieQueue = new Queue('movies', { connection: getConnection(), prefix: 'rt' })
export const tmdbMovieQueue = new Queue('movies', { connection: getConnection(), prefix: 'tmdb' })
export const csfdTvShowQueue = new Queue('tv-shows', { connection: getConnection(), prefix: 'csfd' })
export const rtTvShowQueue = new Queue('tv-shows', { connection: getConnection(), prefix: 'rt' })
export const tmdbTvShowQueue = new Queue('tv-shows', { connection: getConnection(), prefix: 'tmdb' })
export const downloadQueue = new Queue('download', { connection: getConnection(), prefix: 'webshare' })
