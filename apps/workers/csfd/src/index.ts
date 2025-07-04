import type { MovieRecord, TvShowRecord, WorkerAction, WorkerInputData, WorkerResult } from '@repo/types'
import * as csfdScraper from '@repo/csfd-scraper'
import { createDatabase, CsfdMovieDataRepo, CsfdTvShowDataRepo, MovieRepo, MovieTopicsRepo, TvShowRepo, TvShowTopicsRepo } from '@repo/database'
import { csfdMovieQueue, csfdTvShowQueue } from '@repo/queues'
import { env } from '@repo/shared'
import { findCsfdIdInTopic } from '@repo/warforum-scraper'
import { Worker } from 'bullmq'

const connection = { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD }
const db = createDatabase()

async function handleFindId<T extends MovieRecord | TvShowRecord>(
  record: T,
  isMovie: boolean,
): Promise<{ id: number }> {
  const repo = isMovie ? new MovieRepo(db) : new TvShowRepo(db)
  const topicsRepo = isMovie ? new MovieTopicsRepo(db) : new TvShowTopicsRepo(db)
  const topicId = await topicsRepo.getTopicId(record.id)

  // Try to find CSFD ID in topic
  let csfdId = await findCsfdIdInTopic(topicId)

  if (csfdId) {
    await repo.setCsfdId(record.id, csfdId)
    isMovie ? csfdMovieQueue.add('get-meta', { id: csfdId }) : csfdTvShowQueue.add('get-meta', { id: csfdId })
    return { id: csfdId }
  }

  // Try to find CSFD ID using scraper if not found in topic
  csfdId = isMovie
    ? await csfdScraper.findCsfdMovieId(record as MovieRecord)
    : await csfdScraper.findCsfdTvShowId(record as TvShowRecord)

  if (!csfdId) {
    throw new Error(`CSFD ID for ${isMovie ? 'movie' : 'TV show'} ${record.id} not found`)
  }

  await repo.setCsfdId(record.id, csfdId)

  isMovie ? csfdMovieQueue.add('get-meta', { id: csfdId }) : csfdTvShowQueue.add('get-meta', { id: csfdId })
  return { id: csfdId }
}

async function handleGetMeta(csfdId: number, isMovie: boolean): Promise<{ id: number }> {
  if (isMovie) {
    const movieDetails = await csfdScraper.getMovieDetails(csfdId)
    const csfdMovieRepo = new CsfdMovieDataRepo(db)
    await csfdMovieRepo.save(movieDetails)
  }
  else {
    const tvShowDetails = await csfdScraper.getTvShowDetails(csfdId)
    const csfdTvShowRepo = new CsfdTvShowDataRepo(db)
    await csfdTvShowRepo.save(tvShowDetails)
  }

  return { id: csfdId }
}

const _movieWorker = new Worker<WorkerInputData, WorkerResult, WorkerAction>(
  'movies',
  async (job) => {
    switch (job.name) {
      case 'find-id':
        return handleFindId(job.data as MovieRecord, true)
      case 'get-meta':
        return handleGetMeta((job.data as { id: number }).id, true)
      default:
        throw new Error(`Unknown action: ${job.name}`)
    }
  },
  { connection, prefix: 'csfd' },
)

const _tvShowWorker = new Worker<WorkerInputData, WorkerResult, WorkerAction>(
  'tv-shows',
  async (job) => {
    switch (job.name) {
      case 'find-id': {
        const tvShow = job.data as TvShowRecord
        return handleFindId(tvShow, false)
      }
      case 'get-meta': {
        const { id } = job.data as { id: number }
        return handleGetMeta(id, false)
      }
      default:
        throw new Error(`Unknown action: ${job.name}`)
    }
  },
  { connection, prefix: 'csfd' },
)
