import type { MovieRecord, TvShowRecord } from '@repo/database'
import type { MovieSearchResult, TvShowSearchResult } from '@repo/tmdb-fetcher'
import type { MovieTopic, TvShowTopic, WorkerAction, WorkerInputData, WorkerResult } from '@repo/types'
import { createAllRepositories, createDatabase } from '@repo/database'
import { MediaService } from '@repo/media-service'
import { createQueues } from '@repo/queues'
import { moveDefiniteArticleToEnd } from '@repo/shared'
import { createTmdbService } from '@repo/tmdb-fetcher'
import { Worker } from 'bullmq'
import { env } from './env.js'

const connection = { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD }
const db = createDatabase(env.DATABASE_URL)
const repositories = createAllRepositories(db)
const queues = createQueues({ host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD })
const tmdbService = createTmdbService({
  baseUrl: env.TMDB_BASE_URL,
  apiKey: env.TMDB_API_KEY,
  userAgent: env.USER_AGENT,
  delayMin: env.HTTP_CLIENT_DELAY_MIN,
  delayMax: env.HTTP_CLIENT_DELAY_MAX,
})

const _movieWorker = new Worker<WorkerInputData, WorkerResult, WorkerAction>(
  'movies',
  async (job) => {
    switch (job.name) {
      case 'find-id': {
        const movie = job.data as MovieRecord
        const tmdbId = await tmdbService.findTmdbMovieId(movie)
        await repositories.movieRepo.setTmdbId(movie.id, tmdbId)
        queues.tmdbMovieQueue.add('get-meta', { id: tmdbId })
        return { id: tmdbId }
      }

      case 'get-meta': {
        const { id: tmdbId } = job.data as { id: number }
        const movieDetails = await tmdbService.getMovieDetails(tmdbId)
        await repositories.tmdbMovieDataRepo.save(movieDetails)
        return { id: tmdbId }
      }

      case 'find-movie': {
        const movieTopic = job.data as MovieTopic
        let movieSearchResult: MovieSearchResult | null = null
        for (const title of movieTopic.titles) {
          movieSearchResult = await tmdbService.searchMovie({ title, year: movieTopic.year })
          if (movieSearchResult)
            break
        }

        if (!movieSearchResult)
          throw new Error(`TMDB ID for movie ${movieTopic.id} not found`)

        const mediaService = new MediaService(db, queues)
        const movie = {
          czechTitle: movieSearchResult.title,
          originalTitle: moveDefiniteArticleToEnd(movieSearchResult.original_title),
          year: movieTopic.year,
        }
        const movieId = await mediaService.addMovieWithTopic(movie, movieTopic.id, movieTopic.type, movieSearchResult.id)
        return { id: movieId }
      }

      default:
        throw new Error(`Unknown action: ${job.name}`)
    }
  },
  { connection, prefix: 'tmdb' },
)

const _tvShowWorker = new Worker<WorkerInputData, WorkerResult, WorkerAction>(
  'tv-shows',
  async (job) => {
    switch (job.name) {
      case 'find-id': {
        const tvShow = job.data as TvShowRecord
        const tmdbId = await tmdbService.findTmdbTvShowId(tvShow)
        if (!tmdbId) {
          throw new Error(`TMDB ID for tv show ${tvShow.id} not found`)
        }
        await repositories.tvShowRepo.setTmdbId(tvShow.id, tmdbId)
        queues.tmdbTvShowQueue.add('get-meta', { id: tmdbId })
        return { id: tmdbId }
      }

      case 'get-meta': {
        const { id: tmdbId } = job.data as { id: number }
        const meta = await tmdbService.getTvShowDetails(tmdbId)
        await repositories.tmdbTvShowDataRepo.save(meta)
        return { id: tmdbId }
      }

      case 'find-tv-show': {
        const tvShowTopic = job.data as TvShowTopic
        let tvShowSearchResult: TvShowSearchResult | null = null
        for (const title of tvShowTopic.titles) {
          tvShowSearchResult = await tmdbService.searchTvShow({ title })
          if (tvShowSearchResult)
            break
        }

        if (!tvShowSearchResult)
          throw new Error(`TMDB ID for tv show ${tvShowTopic.id} not found`)

        const mediaService = new MediaService(db, queues)
        const tvShow = {
          czechTitle: tvShowSearchResult.name,
          originalTitle: tvShowSearchResult.original_name,
        }
        const tvShowId = await mediaService.addTvShowWithTopic(tvShow, tvShowTopic.languages, tvShowTopic.id, tvShowTopic.type, tvShowSearchResult.id)
        return { id: tvShowId }
      }

      default:
        throw new Error(`Unknown action: ${job.name}`)
    }
  },
  { connection, prefix: 'tmdb' },
)
