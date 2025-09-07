import type { ConnectionOptions } from 'bullmq'
import { Queue } from 'bullmq'

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
}

export function createQueues(config: RedisConfig): Queues {
  const connection: ConnectionOptions = {
    host: config.host,
    port: config.port,
    password: config.password,
  }

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
