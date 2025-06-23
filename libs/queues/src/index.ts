import type { ConnectionOptions } from 'bullmq'
import { env } from '@repo/shared'
import { Queue } from 'bullmq'

const connection: ConnectionOptions = { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD }

export const csfdQueue = new Queue('movies', { connection, prefix: 'csfd' })
export const rtQueue = new Queue('movies', { connection, prefix: 'rt' })
export const tmdbQueue = new Queue('movies', { connection, prefix: 'tmdb' })
