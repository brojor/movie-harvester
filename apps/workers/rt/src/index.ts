import type { MovieRecord, TvShowRecord } from '@repo/database'
import type { WorkerAction, WorkerInputData, WorkerResult } from '@repo/types'
import { createAllRepositories, createDatabase } from '@repo/database'
import { createQueues } from '@repo/queues'
import { findRtMovieId, findRtTvShowId, getMovieDetails, getTvShowDetails } from '@repo/rt-scraper'
import { Worker } from 'bullmq'
import { databaseUrl, redisOptions } from './env.js'

const db = createDatabase(databaseUrl)
const repositories = createAllRepositories(db)
const queues = createQueues(redisOptions)

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
        await repositories.movieRepo.setRtId(movie.id, rtId)
        queues.rtMovieQueue.add('get-meta', { id: rtId })
        return { id: rtId }
      }

      case 'get-meta': {
        const { id: rtId } = job.data as { id: string }
        const movieDetails = await getMovieDetails(rtId)
        await repositories.rtMovieDataRepo.save(movieDetails)
        return { id: rtId }
      }

      default:
        throw new Error(`Unknown action: ${job.name}`)
    }
  },
  { connection: redisOptions, prefix: 'rt' },
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
        await repositories.tvShowRepo.setRtId(tvShow.id, rtId)
        queues.rtTvShowQueue.add('get-meta', { id: rtId })
        return { id: rtId }
      }

      case 'get-meta': {
        const { id: rtId } = job.data as { id: string }
        const meta = await getTvShowDetails(rtId)
        await repositories.rtTvShowDataRepo.save(meta)
        return { id: rtId }
      }

      default:
        throw new Error(`Unknown action: ${job.name}`)
    }
  },
  { connection: redisOptions, prefix: 'rt' },
)
