import type { ConnectionOptions } from 'bullmq'
import { Queue } from 'bullmq'
import { env } from './env.js'

const connection: ConnectionOptions = { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD }

export const csfdMovieQueue = new Queue('movies', { connection, prefix: 'csfd' })
export const rtMovieQueue = new Queue('movies', { connection, prefix: 'rt' })
export const tmdbMovieQueue = new Queue('movies', { connection, prefix: 'tmdb' })

export const csfdTvShowQueue = new Queue('tv-shows', { connection, prefix: 'csfd' })
export const rtTvShowQueue = new Queue('tv-shows', { connection, prefix: 'rt' })
export const tmdbTvShowQueue = new Queue('tv-shows', { connection, prefix: 'tmdb' })

export const downloadQueue = new Queue('download', { connection, prefix: 'webshare' })
