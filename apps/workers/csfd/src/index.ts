import type { MovieRecord, TvShowRecord } from '@repo/database'
import type { WorkerAction, WorkerInputData, WorkerResult } from '@repo/types'
import { findCsfdMovieId, findCsfdTvShowId, getMovieDetails, getTvShowDetails } from '@repo/csfd-scraper'
import { createDatabase, CsfdMovieDataRepo, CsfdTvShowDataRepo, MovieRepo, TvShowRepo } from '@repo/database'
import { env } from '@repo/shared'
import { Worker } from 'bullmq'

const connection = { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD }
const db = createDatabase()

const _movieWorker = new Worker<WorkerInputData, WorkerResult, WorkerAction>(
  'movies',
  async (job) => {
    switch (job.name) {
      case 'find-id': {
        const movie = job.data as MovieRecord
        const csfdId = await findCsfdMovieId(movie)
        const movieRepo = new MovieRepo(db)
        await movieRepo.setCsfdId(movie.id, csfdId)
        return { id: csfdId }
      }

      case 'get-meta': {
        const { id: csfdId } = job.data as { id: number }
        const movieDetails = await getMovieDetails(csfdId)
        const csfdMovieRepo = new CsfdMovieDataRepo(db)
        await csfdMovieRepo.save(movieDetails)
        return { id: csfdId }
      }
    }
  },
  { connection, prefix: 'csfd' },
)

const _tvShowWorker = new Worker<WorkerInputData, WorkerResult, WorkerAction>(
  'tv-show',
  async (job) => {
    switch (job.name) {
      case 'find-id': {
        const tvShow = job.data as TvShowRecord
        const csfdId = await findCsfdTvShowId(tvShow)
        const tvShowRepo = new TvShowRepo(db)
        await tvShowRepo.setCsfdId(tvShow.id, csfdId)
        return { id: csfdId }
      }

      case 'get-meta': {
        const { id: csfdId } = job.data as { id: number }
        const meta = await getTvShowDetails(csfdId)
        const csfdTvShowRepo = new CsfdTvShowDataRepo(db)
        await csfdTvShowRepo.save(meta)
        return { id: csfdId }
      }
    }
  },
  { connection, prefix: 'csfd' },
)
