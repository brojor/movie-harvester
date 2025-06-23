import type { MovieRecord, TvShowRecord } from '@repo/database'
import type { WorkerAction, WorkerInputData, WorkerResult } from '@repo/types'
import { createDatabase, MovieRepo, TmdbMovieDataRepo, TmdbTvShowDataRepo, TvShowRepo } from '@repo/database'
import { env } from '@repo/shared'
import { findTmdbMovieId, findTmdbTvShowId, getMovieDetails, getTvShowDetails } from '@repo/tmdb-fetcher'
import { Worker } from 'bullmq'

const connection = { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD }
const db = createDatabase()

const _movieWorker = new Worker<WorkerInputData, WorkerResult, WorkerAction>(
  'movies',
  async (job) => {
    switch (job.name) {
      case 'find-id': {
        const movie = job.data as MovieRecord
        const tmdbId = await findTmdbMovieId(movie)
        const movieRepo = new MovieRepo(db)
        await movieRepo.setTmdbId(movie.id, tmdbId)
        return { id: tmdbId }
      }

      case 'get-meta': {
        const { id: tmdbId } = job.data as { id: number }
        const movieDetails = await getMovieDetails(tmdbId)
        const tmdbMovieRepo = new TmdbMovieDataRepo(db)
        await tmdbMovieRepo.save(movieDetails)
        return { id: tmdbId }
      }
    }
  },
  { connection, prefix: 'rt' },
)

const _tvShowWorker = new Worker<WorkerInputData, WorkerResult, WorkerAction>(
  'tv-show',
  async (job) => {
    switch (job.name) {
      case 'find-id': {
        const tvShow = job.data as TvShowRecord
        const tmdbId = await findTmdbTvShowId(tvShow)
        if (!tmdbId) {
          throw new Error(`TMDB ID for tv show ${tvShow.id} not found`)
        }
        const tvShowRepo = new TvShowRepo(db)
        await tvShowRepo.setTmdbId(tvShow.id, tmdbId)
        return { id: tmdbId }
      }

      case 'get-meta': {
        const { id: tmdbId } = job.data as { id: number }
        const meta = await getTvShowDetails(tmdbId)
        const tmdbTvShowRepo = new TmdbTvShowDataRepo(db)
        await tmdbTvShowRepo.save(meta)
        return { id: tmdbId }
      }
    }
  },
  { connection, prefix: 'rt' },
)
