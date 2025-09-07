import type { MovieRecord, TvShowRecord } from '@repo/database'
import type { WorkerAction, WorkerInputData, WorkerResult } from '@repo/types'
import { createDatabase, MovieRepo, RtMovieDataRepo, RtTvShowDataRepo, TvShowRepo } from '@repo/database'
import { rtMovieQueue, rtTvShowQueue } from '@repo/queues'
import { findRtMovieId, findRtTvShowId, getMovieDetails, getTvShowDetails } from '@repo/rt-scraper'
import { Worker } from 'bullmq'
import { env } from './env.js'

const connection = { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD }
const db = createDatabase()

const _movieWorker = new Worker<WorkerInputData, WorkerResult, WorkerAction>(
  'movies',
  async (job) => {
    switch (job.name) {
      case 'find-id': {
        const movie = job.data as MovieRecord
        const rtId = await findRtMovieId(movie)
        if (!rtId) {
          throw new Error(`RT ID for movie ${movie.id} not found`)
        }
        const movieRepo = new MovieRepo(db)
        await movieRepo.setRtId(movie.id, rtId)
        rtMovieQueue.add('get-meta', { id: rtId })
        return { id: rtId }
      }

      case 'get-meta': {
        const { id: rtId } = job.data as { id: string }
        const movieDetails = await getMovieDetails(rtId)
        const rtMovieRepo = new RtMovieDataRepo(db)
        await rtMovieRepo.save(movieDetails)
        return { id: rtId }
      }

      default:
        throw new Error(`Unknown action: ${job.name}`)
    }
  },
  { connection, prefix: 'rt' },
)

const _tvShowWorker = new Worker<WorkerInputData, WorkerResult, WorkerAction>(
  'tv-shows',
  async (job) => {
    switch (job.name) {
      case 'find-id': {
        const tvShow = job.data as TvShowRecord
        const rtId = await findRtTvShowId(tvShow)
        if (!rtId) {
          throw new Error(`RT ID for tv show ${tvShow.id} not found`)
        }
        const tvShowRepo = new TvShowRepo(db)
        await tvShowRepo.setRtId(tvShow.id, rtId)
        rtTvShowQueue.add('get-meta', { id: rtId })
        return { id: rtId }
      }

      case 'get-meta': {
        const { id: rtId } = job.data as { id: string }
        const meta = await getTvShowDetails(rtId)
        const rtTvShowRepo = new RtTvShowDataRepo(db)
        await rtTvShowRepo.save(meta)
        return { id: rtId }
      }

      default:
        throw new Error(`Unknown action: ${job.name}`)
    }
  },
  { connection, prefix: 'rt' },
)
