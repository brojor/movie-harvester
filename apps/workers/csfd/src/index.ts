import type { MovieRecord, TvShowRecord, WorkerAction, WorkerInputData, WorkerResult } from '@repo/types'
import * as csfdScraper from '@repo/csfd-scraper'
import { createDatabase, CsfdMovieDataRepo, CsfdTvShowDataRepo, MovieRepo, MovieTopicsRepo, TvShowRepo, TvShowTopicsRepo } from '@repo/database'
import { createQueues } from '@repo/queues'
import { createWarforumScraper } from '@repo/warforum-scraper'
import { Worker } from 'bullmq'
import { env } from './env.js'

const connection = { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD }
const db = createDatabase(env.DATABASE_URL)
const queues = createQueues({ host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD })
const warforumScraper = createWarforumScraper({
  baseUrl: env.WARFORUM_BASE_URL,
  userAgent: env.USER_AGENT,
  sid: env.WARFORUM_SID,
  userId: env.WARFORUM_USER_ID,
  autoLoginId: env.WARFORUM_AUTO_LOGIN_ID,
  indexerDeprecatedDate: env.WARFORUM_INDEXER_DEPRECATED_DATE,
  delayMin: env.HTTP_CLIENT_DELAY_MIN,
  delayMax: env.HTTP_CLIENT_DELAY_MAX,
})

async function handleFindId<T extends MovieRecord | TvShowRecord>(
  record: T,
  isMovie: boolean,
): Promise<{ id: number }> {
  const repo = isMovie ? new MovieRepo(db) : new TvShowRepo(db)
  const topicsRepo = isMovie ? new MovieTopicsRepo(db) : new TvShowTopicsRepo(db)
  const topicId = await topicsRepo.getTopicId(record.id)

  // Try to find CSFD ID in topic
  let csfdId = await warforumScraper.findCsfdIdInTopic(topicId)

  if (csfdId) {
    await repo.setCsfdId(record.id, csfdId)
    isMovie ? queues.csfdMovieQueue.add('get-meta', { id: csfdId }) : queues.csfdTvShowQueue.add('get-meta', { id: csfdId })
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

  isMovie ? queues.csfdMovieQueue.add('get-meta', { id: csfdId }) : queues.csfdTvShowQueue.add('get-meta', { id: csfdId })
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
